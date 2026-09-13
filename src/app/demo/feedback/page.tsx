"use client";

import Link from "next/link";
import { FeedbackPanel } from "@/components/practice/FeedbackPanel";
import { IpaGuide } from "@/components/practice/IpaGuide";
import {
  APPLE_ANNOTATION,
  THANK_YOU_ANNOTATION,
} from "@/lib/annotations";
import type { PronunciationResult } from "@/lib/types";

const DEMO: PronunciationResult = {
  overallScore: 72,
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
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 py-10">
      <div className="space-y-2">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300">
          ← 返回首页
        </Link>
        <h1 className="text-2xl font-semibold text-zinc-100">效果预览 · Design v1</h1>
        <p className="text-sm text-zinc-500">
          朗读前引导（IPA 标注）+ 朗读后反馈（韵律图 · 纠正总结）
        </p>
      </div>

      {/* —— Guide layer —— */}
      <section className="space-y-4">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          朗读前 · Guide
        </p>

        <div className="space-y-6 rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-5">
          <div>
            <p className="mb-3 text-[11px] text-zinc-600">连读 / 弱读示例</p>
            <IpaGuide annotation={APPLE_ANNOTATION} />
          </div>

          <div className="border-t border-zinc-800/80 pt-5">
            <p className="mb-3 text-[11px] text-zinc-600">本句将用于下方反馈</p>
            <IpaGuide annotation={THANK_YOU_ANNOTATION} showLegend={false} />
          </div>
        </div>
      </section>

      {/* —— Feedback layer —— */}
      <section className="space-y-4">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          朗读后 · Feedback
        </p>
        <p className="text-sm text-zinc-500">Thank you very much. — Mock</p>
        <FeedbackPanel
          result={DEMO}
          audioUrl={null}
          prosodyWords={["Thank", "you", "ˈver-", "much"]}
        />
      </section>
    </div>
  );
}
