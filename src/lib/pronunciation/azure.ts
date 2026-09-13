import type { PronunciationResult, ReferenceInput } from "../types";
import type { PronunciationProvider } from "./types";
import { mockProvider } from "./mock";

/**
 * Azure Speech Pronunciation Assessment stub.
 * Falls back to mock when AZURE_SPEECH_KEY / AZURE_SPEECH_REGION are missing.
 * Wire real SDK later — keep interface stable.
 */
export class AzurePronunciationProvider implements PronunciationProvider {
  readonly name = "azure";

  private get configured(): boolean {
    return Boolean(
      process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION,
    );
  }

  async analyze(
    audio: Blob | ArrayBuffer | null,
    reference: ReferenceInput,
  ): Promise<PronunciationResult> {
    if (!this.configured) {
      const result = await mockProvider.analyze(audio, reference);
      return { ...result, provider: "azure→mock" };
    }

    // Placeholder for real Azure Speech SDK integration.
    // Without credentials we never reach here in normal MVP use.
    const result = await mockProvider.analyze(audio, reference);
    return {
      ...result,
      provider: "azure-stub",
      tips: [
        ...result.tips.slice(0, 2),
        "（Azure 密钥已配置，但本 MVP 仍使用 stub；请接入 Speech SDK。）",
      ],
    };
  }
}

export const azureProvider = new AzurePronunciationProvider();
