import "server-only";
import { CoachError } from "./contracts";

export function hasCoachKey() { return Boolean(process.env.OPENAI_API_KEY?.trim()); }

/** Request bodies are bounded even when content-length is missing/chunked. */
export async function boundedRequest(request: Request, limit: number): Promise<Request> {
  if (Number(request.headers.get("content-length")) > limit) throw new CoachError("内容太大，请缩短后重试。", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new CoachError("请求内容为空。");
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > limit) { await reader.cancel(); throw new CoachError("内容太大，请缩短后重试。", 413); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return new Request(request.url, { method: "POST", headers: request.headers, body: Buffer.concat(chunks) });
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const url = new URL(request.url);
  // Next can reconstruct request.url with localhost behind its production server.
  // Host retains the actual browser-facing authority; do not trust forwarded-host.
  const authority = request.headers.get("host") || url.host;
  let source: URL;
  try { source = new URL(origin); } catch { throw new CoachError("请求来源无效。", 403); }
  if (!["http:", "https:"].includes(source.protocol) || source.host !== authority)
    throw new CoachError("请从本站页面发起请求。", 403);
}

// Per-process backstop; a public multi-instance deployment should also use gateway rate limits.
const requests = new Map<string, { count: number; expires: number }>();
export function guard(request: Request) {
  sameOrigin(request);
  const now = Date.now();
  for (const [key, item] of requests) if (item.expires < now) requests.delete(key);
  // Only trust this header on Vercel, where it is overwritten by the ingress.
  const identity = process.env.VERCEL ? (request.headers.get("x-vercel-forwarded-for") || "shared") : "shared";
  const key = `${new URL(request.url).pathname}:${identity}`;
  const item = requests.get(key) ?? { count: 0, expires: now + 60_000 };
  if (++item.count > 30) throw new CoachError("请求有点频繁，请稍等一分钟再试。", 429);
  if (requests.size < 10_000 || requests.has(key)) requests.set(key, item);
  else throw new CoachError("当前服务繁忙，请稍后再试。", 429);
}

export async function openai(path: string, body: object | FormData, signal?: AbortSignal) {
  if (!hasCoachKey()) throw new CoachError("AI 服务尚未启用，请先体验示例。部署者需配置 OPENAI_API_KEY。", 503);
  const response = await fetch(`https://api.openai.com/v1/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      ...(body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    },
    body: body instanceof FormData ? body : JSON.stringify(body),
    signal: AbortSignal.any([AbortSignal.timeout(55_000), ...(signal ? [signal] : [])]),
    cache: "no-store",
  });
  if (!response.ok) {
    // Do not expose provider responses, credentials or user text in logs.
    if (response.status === 429) {
      const failure = await response.json().catch(() => null);
      const code = failure?.error?.code;
      if (code === "credit_balance_exhausted" || code === "insufficient_quota" || failure?.error?.type === "insufficient_quota") {
        throw new CoachError("AI 服务的 API 额度已用完，请在 OpenAI 平台补充额度后重试。", 503);
      }
    }
    throw new CoachError(response.status === 429 ? "AI 服务暂时繁忙，请稍后再试。" : "AI 服务暂时无法完成请求，请稍后重试或检查部署配置。", 502);
  }
  return response;
}

export function errorResponse(error: unknown) {
  if (error instanceof CoachError) return Response.json({ error: error.message }, { status: error.status });
  if (error instanceof SyntaxError) return Response.json({ error: "请求格式不正确，请重试。" }, { status: 400 });
  if (error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name))
    return Response.json({ error: "等待时间有点长，请重试。" }, { status: 504 });
  return Response.json({ error: "暂时无法完成，请再试一次。" }, { status: 500 });
}
