import { requireLocalChatGPT, chatGPTMessage } from "@/lib/coach/chatgpt-policy";
import { beginChatGPTLogin, chatGPTStatus, disconnectChatGPT } from "@/lib/coach/chatgpt";
import { CoachError } from "@/lib/coach/contracts";
import { errorResponse, guard } from "@/lib/coach/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    requireLocalChatGPT(request);
    return Response.json(await chatGPTStatus(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try {
    requireLocalChatGPT(request); guard(request);
    return Response.json(await beginChatGPTLogin(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}

export async function DELETE(request: Request) {
  try {
    requireLocalChatGPT(request); guard(request);
    await disconnectChatGPT();
    return Response.json({ status: "disconnected", sharing: false });
  } catch (error) {
    if (!(error instanceof CoachError) && error && typeof error === "object" && "code" in error)
      return errorResponse(new CoachError(chatGPTMessage(String(error.code)), 502));
    return errorResponse(error);
  }
}
