import { CoachError, MAX_AUDIO_BYTES, prepareText } from "@/lib/coach/contracts";
import { boundedRequest, errorResponse, guard, openai } from "@/lib/coach/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    guard(request);
    const form = await (await boundedRequest(request, MAX_AUDIO_BYTES + 16_384)).formData();
    const audio = form.get("audio");
    if (!(audio instanceof File) || audio.size === 0) throw new CoachError("没有收到录音，请重新录一遍。");
    if (audio.size > MAX_AUDIO_BYTES) throw new CoachError("录音太大，请控制在一分钟内。", 413);
    const mime = audio.type.split(";")[0];
    const extensions: Record<string, string> = {
      "audio/webm": "webm", "audio/mp4": "mp4", "audio/mpeg": "mp3", "audio/wav": "wav",
      "audio/x-wav": "wav", "audio/ogg": "ogg",
    };
    if (!extensions[mime]) throw new CoachError("暂不支持这个录音格式，请换用 Chrome、Edge 或 Safari。", 415);
    const upstream = new FormData();
    upstream.set("file", audio, `recording.${extensions[mime]}`);
    upstream.set("model", process.env.OPENAI_TRANSCRIPTION_MODEL || "gpt-4o-mini-transcribe");
    upstream.set("language", "en");
    upstream.set("response_format", "json");
    const response = await openai("audio/transcriptions", upstream, request.signal);
    const result = await response.json();
    if (typeof result.text !== "string" || !result.text.trim()) throw new CoachError("没有听清英文，请靠近麦克风再说一次。", 422);
    const { text } = prepareText(result.text);
    return Response.json({ text, kind: "transcript", assessment: null }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
