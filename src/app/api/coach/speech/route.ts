import { prepareText } from "@/lib/coach/contracts";
import { SPEECH_INSTRUCTIONS } from "@/lib/coach/prompt";
import { boundedRequest, errorResponse, guard, openai } from "@/lib/coach/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    guard(request);
    const body = await (await boundedRequest(request, 12_000)).json();
    const { text } = prepareText(body?.text);
    const response = await openai("audio/speech", {
      model: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
      voice: process.env.OPENAI_TTS_VOICE || "coral",
      input: text,
      instructions: SPEECH_INSTRUCTIONS,
      response_format: "mp3",
    }, request.signal);
    return new Response(response.body, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
