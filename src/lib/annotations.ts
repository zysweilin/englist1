import type { PhonemeFeedback, PronunciationResult, WordUnit } from "./types";

/** Token kinds for the IPA guide line. */
export type IpaTokenKind = "content" | "weak" | "other";

export type IpaToken = {
  /** Display text (may include stress mark ˈ). */
  text: string;
  kind: IpaTokenKind;
  /** Draw a linking arc to the next word token. */
  linkAfter?: boolean;
};

export type SentenceAnnotation = {
  text: string;
  gloss?: string;
  tokens: IpaToken[];
};

/** Demo: rich linking + weak forms. */
export const APPLE_ANNOTATION: SentenceAnnotation = {
  text: "I want to eat an apple.",
  gloss: "我想吃一个苹果。",
  tokens: [
    { text: "aɪ", kind: "content" },
    { text: "ˈwɒnt", kind: "content" },
    { text: "tə", kind: "weak" },
    { text: "ˈiːt", kind: "content" },
    { text: "ən", kind: "weak", linkAfter: true },
    { text: "ˈæpəl", kind: "content" },
  ],
};

/** Demo: feedback sentence. */
export const THANK_YOU_ANNOTATION: SentenceAnnotation = {
  text: "Thank you very much.",
  gloss: "非常感谢。",
  tokens: [
    { text: "ˈθæŋk", kind: "content" },
    { text: "ju", kind: "weak" },
    { text: "ˈvɛri", kind: "content" },
    { text: "mʌtʃ", kind: "content" },
  ],
};

/** Short Chinese mouth-shape tips keyed by expected IPA. */
export const PHONEME_TIP_ZH: Record<string, string> = {
  θ: "舌尖轻触上齿缝，送气；别用 /s/ 或 /f/。",
  ð: "舌尖抵上齿并振动；别发成 /d/ 或 /z/。",
  v: "上齿轻咬下唇并振动；别用 /w/。",
  w: "双唇圆拢前突，别发成 /v/。",
  r: "舌尖上卷不碰上颚；别发成 /l/。",
  l: "舌尖抵上齿龈；别发成 /r/。",
  ʃ: "双唇略前突，气流从舌面中部流出。",
  ʒ: "类似 /ʃ/ 但声带振动。",
  æ: "嘴张大、舌头压低；别发成 /ɛ/。",
  ɪ: "比 /i/ 更松、更短；bit ≠ beat。",
  ʊ: "比 /u/ 更松、更短。",
  ŋ: "软腭鼻音，别发成 /n/。",
  ə: "放松下巴，发成轻短的「呃」。",
};

export type CorrectionItem = {
  expectedIpa: string;
  heardIpa: string;
  score: number;
  tipZh: string;
  word?: string;
};

const DEFAULT_TIP = "放慢一点，把这个音素咬清楚再提速。";

/**
 * Pick the worst mismatched phonemes across words.
 * Score threshold + max N; one tip per expected IPA.
 */
export function pickWorstCorrections(
  result: PronunciationResult,
  opts: { max?: number; threshold?: number } = {},
): CorrectionItem[] {
  const max = opts.max ?? 3;
  const threshold = opts.threshold ?? 70;

  const candidates: CorrectionItem[] = [];
  for (const w of result.words) {
    for (const p of w.phonemes) {
      const mismatch = p.expectedIpa !== p.heardIpa;
      if (!mismatch && p.score >= threshold) continue;
      if (p.score >= threshold) continue;
      candidates.push({
        expectedIpa: p.expectedIpa,
        heardIpa: p.heardIpa,
        score: p.score,
        tipZh: PHONEME_TIP_ZH[p.expectedIpa] ?? DEFAULT_TIP,
        word: w.word,
      });
    }
  }

  candidates.sort((a, b) => a.score - b.score);

  const seen = new Set<string>();
  const out: CorrectionItem[] = [];
  for (const c of candidates) {
    const key = c.expectedIpa;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
    if (out.length >= max) break;
  }
  return out;
}

/** One-line Chinese reason from overall score + top issues. */
export function oneLineReason(result: PronunciationResult, issues: CorrectionItem[]): string {
  if (result.overallScore >= 85) return "音素清晰，节奏自然，继续保持。";
  if (issues.length === 0) {
    if (result.overallScore >= 70) return "整体不错，再把语调起伏拉开一点。";
    return "节奏偏平，建议对照范读重练一次。";
  }
  const phones = issues.map((i) => `/${i.expectedIpa}/`).join("、");
  if (result.overallScore >= 70) return `良好，但 ${phones} 还需纠正。`;
  return `优先改 ${phones}，口型到位后再提速。`;
}

export function mockProsodyCurves(wordCount: number): {
  native: number[];
  learner: number[];
  labels: string[];
} {
  // Normalized 0–1 pitch samples (smooth curves).
  const n = Math.max(wordCount * 4, 12);
  const native: number[] = [];
  const learner: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    // Native: rise on stress peaks
    const peak1 = Math.exp(-Math.pow((t - 0.22) / 0.08, 2));
    const peak2 = Math.exp(-Math.pow((t - 0.55) / 0.1, 2));
    const base = 0.35 + 0.08 * Math.sin(t * Math.PI * 1.2);
    native.push(Math.min(1, base + 0.45 * peak1 + 0.55 * peak2));
    // Learner: flatter
    learner.push(0.38 + 0.06 * Math.sin(t * Math.PI * 0.9) + 0.08 * peak2 * 0.35);
  }
  return { native, learner, labels: [] };
}


const WEAK_WORDS = new Set([
  "a",
  "an",
  "the",
  "to",
  "of",
  "you",
  "is",
  "are",
  "am",
  "and",
  "for",
  "in",
  "on",
  "at",
]);

/** Build an IPA guide annotation from curriculum word units. */
export function annotationFromWords(
  text: string,
  gloss: string,
  words: WordUnit[],
): SentenceAnnotation {
  return {
    text,
    gloss,
    tokens: words.map((w) => {
      const bare = w.word.replace(/[.,!?']$/g, "").toLowerCase();
      return {
        text: w.ipa,
        kind: (WEAK_WORDS.has(bare) ? "weak" : "content") as IpaTokenKind,
      };
    }),
  };
}
