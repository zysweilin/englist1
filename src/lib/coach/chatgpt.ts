import "server-only";
import { join } from "node:path";
import { createChatGPT, type ChatGPTClient, type ChatGPTModel } from "@siwc/local";
import { ANALYSIS_SCHEMA, CoachError, type prepareText, validateAnalysis } from "./contracts";
import { COACH_PROMPT } from "./prompt";
import { windowsEncryption } from "./windows-encryption";
import { chatGPTMessage } from "./chatgpt-policy";

type Runtime = {
  client: ChatGPTClient;
  loginUrl?: string;
  login?: Promise<void>;
  loginError?: string;
  models?: ChatGPTModel[];
  model?: string;
};
const globals = globalThis as typeof globalThis & { englistChatGPT?: Runtime };
function runtime(): Runtime {
  if (!globals.englistChatGPT) {
    const state = {} as Runtime;
    state.client = createChatGPT({
      appName: "Englist Pronunciation", appId: "englist-pronunciation", redirectPort: 0,
      storageDir: join(process.cwd(), ".local", "chatgpt"),
      credentialEncryption: windowsEncryption, sendHostId: true,
      openBrowser: (url) => { state.loginUrl = url; },
    });
    globals.englistChatGPT = state;
  }
  return globals.englistChatGPT;
}

function safeCode(error: unknown): string {
  return error && typeof error === "object" && "code" in error && typeof error.code === "string" ? error.code : "connection_error";
}

export async function chatGPTStatus() {
  const state = runtime();
  const session = await state.client.getSession();
  return {
    status: session.status, sharing: session.sharing, identity: session.identity,
    loginUrl: session.status === "connecting" ? state.loginUrl : undefined,
    model: state.model, error: state.loginError || (session.error ? chatGPTMessage(session.error.code) : undefined),
  };
}

export async function beginChatGPTLogin() {
  const state = runtime();
  if (!state.login) {
    state.loginUrl = undefined; state.loginError = undefined; state.models = undefined; state.model = undefined;
    state.login = state.client.signIn().then(() => {}).catch((error: unknown) => {
      state.loginError = chatGPTMessage(safeCode(error));
    }).finally(() => { state.login = undefined; state.loginUrl = undefined; });
  }
  const deadline = Date.now() + 25_000;
  const pending = () => Boolean(state.login);
  while (pending() && !state.loginUrl && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 100));
  if (!state.loginUrl) throw new CoachError(state.loginError || "登录页面尚未准备好，请稍后重试。", 503);
  return { url: state.loginUrl };
}

export async function disconnectChatGPT() {
  const state = runtime();
  state.client.cancelSignIn();
  await state.login;
  await state.client.disconnect();
  state.models = undefined; state.model = undefined; state.loginError = undefined;
}

export async function analyzeWithChatGPT(source: ReturnType<typeof prepareText>, signal?: AbortSignal) {
  const state = runtime();
  try {
    const session = await state.client.getSession();
    if (session.status !== "connected") throw new CoachError("请先点击 Continue with ChatGPT，完成登录授权。", 401);
    if (!session.sharing) throw new CoachError(chatGPTMessage("sharing_not_enabled"), 403);
    state.models ??= await state.client.listModels({ signal });
    const configured = process.env.CHATGPT_ANALYSIS_MODEL;
    const selected = configured ? state.models.find((model) => model.slug === configured) : state.models[0];
    if (!selected) throw new CoachError("当前 ChatGPT 账户未返回可用文本模型，请检查套餐授权。", 503);
    state.model = selected.displayName;
    // The official local SDK exposes streaming text. Validate its JSON ourselves;
    // do not assume this OAuth route supports all ordinary API options.
    const response = await state.client.streamResponse({
      model: selected.slug,
      instructions: `${COACH_PROMPT}\nReturn one JSON object only, no Markdown fences, matching this schema:\n${JSON.stringify(ANALYSIS_SCHEMA)}`,
      input: JSON.stringify(source.sentences.map((sentence) => ({
        id: sentence.id, text: sentence.text,
        words: sentence.words.map((word, index) => ({ index, text: word.text })),
      }))),
      signal,
    });
    let raw: unknown;
    try { raw = JSON.parse(response.text.trim().replace(/^```(?:json)?\s*([\s\S]*?)\s*```$/, "$1")); }
    catch { throw new CoachError("ChatGPT 未返回完整的音标数据，请重试。", 502); }
    return validateAnalysis(raw, source, true);
  } catch (error) {
    if (error instanceof CoachError) throw error;
    throw new CoachError(chatGPTMessage(safeCode(error)), 502);
  }
}
