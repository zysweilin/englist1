import type { PronunciationProvider } from "./types";
import { mockProvider } from "./mock";
import { azureProvider } from "./azure";

export type { PronunciationProvider } from "./types";
export { mockProvider } from "./mock";
export { azureProvider } from "./azure";

export type ProviderId = "mock" | "azure";

export function getPronunciationProvider(
  id: ProviderId = (process.env.PRONUNCIATION_PROVIDER as ProviderId) || "mock",
): PronunciationProvider {
  if (id === "azure") return azureProvider;
  return mockProvider;
}
