"use client";

import Link from "next/link";
import { FeedbackPanel } from "@/components/practice/FeedbackPanel";
import { IpaGuide } from "@/components/practice/IpaGuide";
import { THANK_YOU_ANNOTATION } from "@/lib/annotations";
import type { PronunciationResult } from "@/lib/types";

/** Main demo: overallScore 82 → Good badge + θ/v/ŋ corrections. */
const DEMO: PronunciationResult = {
  overallScore: 82,
  provider: "mock",
  durationMs: 1950,
  tips: [],
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
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10">
      <div className="space-y-2">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-800">
          ← 返回首页
        </Link>
        <h1 className="text-2xl font-semibold text-zinc-900">效果预览 · Light</h1>
        <p className="text-sm text-zinc-500">
          定性徽章 · 等宽音素条 · 韵律叠放 · 标准音 / 我的发音
        </p>
      </div>

      {/* Guide */}
      <section className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          朗读前 · Guide
        </p>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <IpaGuide annotation={THANK_YOU_ANNOTATION} />
        </div>
      </section>

      {/* Feedback — score 82 → Good */}
      <section className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          朗读后 · Feedback（score 82 → Good）
        </p>
        <FeedbackPanel
          result={DEMO}
          audioUrl={null}
          referenceText="Thank you very much."
          prosodyWords={["Thank", "you", "ˈver-", "much"]}
        />
      </section>
    </div>
  );
}
