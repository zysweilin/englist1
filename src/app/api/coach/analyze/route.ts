import { ANALYSIS_SCHEMA, CoachError, prepareText, validateAnalysis } from "@/lib/coach/contracts";
import { exampleLesson } from "@/lib/coach/examples";
import { COACH_PROMPT } from "@/lib/coach/prompt";
import { boundedRequest, errorResponse, guard, hasCoachKey, openai } from "@/lib/coach/server";
import { requireLocalChatGPT, usesChatGPTPlan } from "@/lib/coach/chatgpt-policy";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    guard(request);
    const body = await (await boundedRequest(request, 12_000)).json();
    const source = prepareText(body?.text);
    if (usesChatGPTPlan()) {
      requireLocalChatGPT(request);
      const { analyzeWithChatGPT } = await import("@/lib/coach/chatgpt");
      return Response.json(await analyzeWithChatGPT(source, request.signal), { headers: { "Cache-Control": "no-store" } });
    }
    if (!hasCoachKey()) {
      const example = exampleLesson(source.text);
      if (example) return Response.json(example, { headers: { "Cache-Control": "no-store" } });
      throw new CoachError("AI 分析尚未启用。现在可以试听原文、录音，或选择下方示例；部署者需配置 OPENAI_API_KEY。", 503);
    }
    const response = await openai("responses", {
      model: process.env.OPENAI_ANALYSIS_MODEL || "gpt-4.1-mini",
      store: false,
      instructions: COACH_PROMPT,
      input: JSON.stringify(source.sentences.map((sentence) => ({
        id: sentence.id, text: sentence.text, words: sentence.words.map((word, index) => ({ index, text: word.text })),
      }))),
      max_output_tokens: 16000,
      text: { format: { type: "json_schema", name: "pronunciation_lesson", strict: true, schema: ANALYSIS_SCHEMA } },
    }, request.signal);
    const data = await response.json();
    if (data.status !== "completed" || !Array.isArray(data.output)) throw new CoachError("分析未完成，请缩短段落再试。", 502);
    const output = data.output.flatMap((item: { content?: { type: string; text?: string }[] }) => item.content ?? [])
      .filter((item: { type: string }) => item.type === "output_text")
      .map((item: { text: string }) => item.text).join("");
    let raw: unknown;
    try { raw = JSON.parse(output); } catch { throw new CoachError("没有收到完整的发音分析，请重试。", 502); }
    return Response.json(validateAnalysis(raw, source, true), { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
