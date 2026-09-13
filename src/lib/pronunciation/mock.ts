import type {
  PhonemeFeedback,
  PronunciationResult,
  ReferenceInput,
  WordFeedback,
} from "../types";
import type { PronunciationProvider } from "./types";

/** Common Chinese L1 substitution patterns for realistic mock errors. */
const L1_SUBS: Record<string, string[]> = {
  θ: ["s", "f"],
  ð: ["d", "z"],
  v: ["w", "f"],
  w: ["v"],
  r: ["l"],
  l: ["r"],
  ʃ: ["s"],
  ʒ: ["ʃ", "z"],
  æ: ["ɛ"],
  ɪ: ["i"],
  ʊ: ["u"],
  ə: ["a"],
  ŋ: ["n"],
};

const TIP_BANK: Record<string, string[]> = {
  θ: [
    "发 /θ/ 时舌尖轻触上齿，送气；别用 /s/ 或 /f/ 代替。",
    "试试：think /θɪŋk/ —— 舌尖夹在上下齿之间。",
  ],
  ð: [
    "发 /ð/ 时舌尖抵上齿并振动声带；别发成 /d/ 或 /z/。",
    "对比：this /ðɪs/ vs. dis —— 舌尖要露出一点。",
  ],
  v: [
    "发 /v/ 时上齿咬下唇并振动；别用 /w/ 或 /f/。",
    "very /ˈvɛri/：上齿轻咬下唇，感觉嘴唇在「颤」。",
  ],
  ʃ: [
    "发 /ʃ/ 时双唇略前突，气流从舌面中部流出。",
    "she /ʃi/：嘴唇收圆一点，别发成 /s/。",
  ],
  ʒ: [
    "发 /ʒ/ 类似 /ʃ/ 但声带振动，如 measure /ˈmɛʒər/。",
  ],
  æ: [
    "发 /æ/ 时嘴张大、舌头压低，类似「啊」但更前。",
    "thank /θæŋk/ 的元音别发成 /ɛ/（如 bed）。",
  ],
  ɪ: [
    "短元音 /ɪ/ 比 /i/ 更松、更短；bit ≠ beat。",
  ],
  r: [
    "美式 /r/ 舌尖上卷但不碰上颚；别发成 /l/。",
  ],
  default: [
    "注意重音落点，弱读音节可发成 /ə/。",
    "放慢一点，把每个音素咬清楚再提速。",
    "听完示范后再跟读，先对齐节奏再抠音素。",
  ],
};

function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickHeard(expected: string, rnd: () => number): { heard: string; score: number } {
  const subs = L1_SUBS[expected];
  // Hard phonemes fail more often; others stay mostly correct.
  const hard = Boolean(subs);
  const failChance = hard ? 0.55 : 0.12;
  if (subs && rnd() < failChance) {
    const heard = subs[Math.floor(rnd() * subs.length)];
    const score = 28 + Math.floor(rnd() * 35);
    return { heard, score };
  }
  const score = hard ? 72 + Math.floor(rnd() * 24) : 82 + Math.floor(rnd() * 18);
  return { heard: expected, score };
}

function buildTips(errors: string[]): string[] {
  const tips: string[] = [];
  const seen = new Set<string>();
  for (const ph of errors) {
    if (tips.length >= 3) break;
    const bank = TIP_BANK[ph] ?? TIP_BANK.default;
    for (const tip of bank) {
      if (!seen.has(tip)) {
        seen.add(tip);
        tips.push(tip);
        break;
      }
    }
  }
  while (tips.length < 1) {
    tips.push(TIP_BANK.default[0]);
  }
  if (tips.length < 2 && rndTip()) {
    tips.push(TIP_BANK.default[1]);
  }
  return tips.slice(0, 3);

  function rndTip() {
    return tips.length < 2;
  }
}

export class MockPronunciationProvider implements PronunciationProvider {
  readonly name = "mock";

  async analyze(
    _audio: Blob | ArrayBuffer | null,
    reference: ReferenceInput,
  ): Promise<PronunciationResult> {
    // Simulate network / analysis latency
    await new Promise((r) => setTimeout(r, 420 + Math.floor(Math.random() * 280)));

    const rnd = mulberry32(hashSeed(reference.text));
    const words: WordFeedback[] = [];
    const errorPhones: string[] = [];
    let cursor = 80;
    let scoreSum = 0;

    for (const unit of reference.words) {
      const phonemes: PhonemeFeedback[] = [];
      let wordScoreSum = 0;
      const wordStart = cursor;

      for (const expected of unit.phonemes) {
        const dur = 70 + Math.floor(rnd() * 90);
        const { heard, score } = pickHeard(expected, rnd);
        if (heard !== expected) errorPhones.push(expected);
        phonemes.push({
          expectedIpa: expected,
          heardIpa: heard,
          score,
          startMs: cursor,
          endMs: cursor + dur,
        });
        wordScoreSum += score;
        cursor += dur;
      }

      // Small gap between words
      cursor += 40 + Math.floor(rnd() * 50);
      const wordScore =
        phonemes.length === 0 ? 85 : Math.round(wordScoreSum / phonemes.length);
      scoreSum += wordScore;

      words.push({
        word: unit.word,
        ipa: unit.ipa,
        score: wordScore,
        phonemes,
        startMs: wordStart,
        endMs: phonemes.length ? phonemes[phonemes.length - 1].endMs : wordStart + 120,
      });
    }

    const overallScore =
      words.length === 0 ? 80 : Math.round(scoreSum / words.length);
    const tips = buildTips(errorPhones);

    // Deduplicate tip selection a bit when many errors of same type
    const uniqueTips = [...new Set(tips)].slice(0, 3);

    return {
      overallScore,
      words,
      tips: uniqueTips.length ? uniqueTips : [TIP_BANK.default[0]],
      durationMs: cursor + 60,
      provider: this.name,
    };
  }
}

export const mockProvider = new MockPronunciationProvider();
