import type { PronunciationResult, ReferenceInput } from "../types";

export interface PronunciationProvider {
  readonly name: string;
  analyze(audio: Blob | ArrayBuffer | null, reference: ReferenceInput): Promise<PronunciationResult>;
}
