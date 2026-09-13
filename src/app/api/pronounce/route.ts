import { NextRequest, NextResponse } from "next/server";
import { getPronunciationProvider, type ProviderId } from "@/lib/pronunciation";
import type { ReferenceInput } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let audio: Blob | null = null;
    let reference: ReferenceInput;
    let providerId: ProviderId = "mock";

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const audioPart = form.get("audio");
      if (audioPart instanceof Blob) audio = audioPart;
      const refRaw = form.get("reference");
      if (typeof refRaw !== "string") {
        return NextResponse.json({ error: "missing reference" }, { status: 400 });
      }
      reference = JSON.parse(refRaw) as ReferenceInput;
      const p = form.get("provider");
      if (typeof p === "string" && (p === "mock" || p === "azure")) providerId = p;
    } else {
      const body = (await req.json()) as {
        reference: ReferenceInput;
        provider?: ProviderId;
      };
      reference = body.reference;
      if (body.provider === "azure" || body.provider === "mock") {
        providerId = body.provider;
      }
    }

    if (!reference?.text || !Array.isArray(reference.words)) {
      return NextResponse.json({ error: "invalid reference" }, { status: 400 });
    }

    const provider = getPronunciationProvider(providerId);
    const result = await provider.analyze(audio, reference);
    return NextResponse.json(result);
  } catch (err) {
    console.error("pronounce error", err);
    return NextResponse.json({ error: "analysis failed" }, { status: 500 });
  }
}
