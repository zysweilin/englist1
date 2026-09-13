"use client";

import { FeedbackPanel } from "@/components/practice/FeedbackPanel";
import type { PronunciationResult } from "@/lib/types";
import Link from "next/link";

const DEMO: PronunciationResult = {
  overallScore: 72,
  provider: "mock",
  durationMs: 1950,
  tips: [
    "发 /θ/ 时舌尖轻触上齿，送气；别用 /s/ 或 /f/ 代替。",
    "发 /v/ 时上齿咬下唇并振动；别用 /w/ 或 /f/。",
    "放慢一点，把每个音素咬清楚再提速。",
  ],
  words: [
    {
      word: "Thank",
      ipa: "θæŋk",
      score: 58,
      startMs: 80,
      endMs: 560,
      phonemes: [
        { expectedIpa: "θ", heardIpa: "s", score: 42, startMs: 80, endMs: 160 },
        { expectedIpa: "æ", heardIpa: "æ", score: 78, startMs: 160, endMs: 280 },
        { expectedIpa: "ŋ", heardIpa: "n", score: 45, startMs: 280, endMs: 420 },
        { expectedIpa: "k", heardIpa: "k", score: 88, startMs: 420, endMs: 560 },
      ],
    },
    {
      word: "you",
      ipa: "ju",
      score: 90,
      startMs: 600,
      endMs: 780,
      phonemes: [
        { expectedIpa: "j", heardIpa: "j", score: 92, startMs: 600, endMs: 690 },
        { expectedIpa: "u", heardIpa: "u", score: 88, startMs: 690, endMs: 780 },
      ],
    },
    {
      word: "very",
      ipa: "ˈvɛri",
      score: 64,
      startMs: 840,
      endMs: 1300,
      phonemes: [
        { expectedIpa: "v", heardIpa: "w", score: 38, startMs: 840, endMs: 930 },
        { expectedIpa: "ɛ", heardIpa: "ɛ", score: 90, startMs: 930, endMs: 1080 },
        { expectedIpa: "r", heardIpa: "l", score: 55, startMs: 1080, endMs: 1210 },
        { expectedIpa: "i", heardIpa: "i", score: 86, startMs: 1210, endMs: 1300 },
      ],
    },
    {
      word: "much.",
      ipa: "mʌtʃ",
      score: 91,
      startMs: 1380,
      endMs: 1800,
      phonemes: [
        { expectedIpa: "m", heardIpa: "m", score: 90, startMs: 1380, endMs: 1480 },
        { expectedIpa: "ʌ", heardIpa: "ʌ", score: 92, startMs: 1480, endMs: 1620 },
        { expectedIpa: "tʃ", heardIpa: "tʃ", score: 91, startMs: 1620, endMs: 1800 },
      ],
    },
  ],
};

export default function FeedbackDemoPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300">
        ← 返回首页
      </Link>
      <h1 className="text-2xl font-semibold text-zinc-100">音素反馈演示 · Feedback Demo</h1>
      <p className="text-sm text-zinc-500">Thank you very much. — Mock phoneme UI</p>
      <FeedbackPanel result={DEMO} audioUrl={null} />
    </div>
  );
}
