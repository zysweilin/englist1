"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FeedbackPanel } from "@/components/practice/FeedbackPanel";
import { IpaGuide } from "@/components/practice/IpaGuide";
import {
  listDialogues,
  listShadowing,
  LEVELS,
  MODES,
} from "@/lib/curriculum";
import {
  THANK_YOU_ANNOTATION,
  type SentenceAnnotation,
} from "@/lib/annotations";
import type { Level, Mode, PronunciationResult, WordUnit } from "@/lib/types";

/** Shared thank-you mock (score 82 → Good). */
const THANK_YOU_DEMO: PronunciationResult = {
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

function annotationFromWords(
  text: string,
  gloss: string,
  words: WordUnit[],
): SentenceAnnotation {
  const weakSet = new Set(["a", "an", "the", "to", "of", "you", "is", "are", "am"]);
  return {
    text,
    gloss,
    tokens: words.map((w) => {
      const bare = w.word.replace(/[.,!?]$/, "").toLowerCase();
      return {
        text: w.ipa,
        kind: (weakSet.has(bare) ? "weak" : "content") as "weak" | "content",
      };
    }),
  };
}

function mockFromWords(words: WordUnit[], overallScore = 82): PronunciationResult {
  let t = 0;
  return {
    overallScore,
    provider: "mock",
    durationMs: 1800,
    tips: [],
    words: words.map((w) => {
      const phonemes = w.phonemes.map((ph, i) => {
        const start = t;
        const end = t + 80;
        t = end + 10;
        const bad = i === 0 && (ph === "θ" || ph === "v" || ph === "ð");
        return {
          expectedIpa: ph,
          heardIpa: bad ? (ph === "θ" ? "s" : ph === "v" ? "w" : "d") : ph,
          score: bad ? 40 : 88,
          startMs: start,
          endMs: end,
        };
      });
      const score = Math.round(
        phonemes.reduce((s, p) => s + p.score, 0) / Math.max(1, phonemes.length),
      );
      return {
        word: w.word,
        ipa: w.ipa,
        score,
        phonemes,
        startMs: phonemes[0]?.startMs ?? 0,
        endMs: phonemes[phonemes.length - 1]?.endMs ?? 0,
      };
    }),
  };
}

function PracticeInner() {
  const params = useSearchParams();
  const level = (params.get("level") as Level) || "L1";
  const mode = (params.get("mode") as Mode) || "shadowing";

  const levelMeta = LEVELS.find((l) => l.id === level);
  const modeMeta = MODES.find((m) => m.id === mode);

  const { annotation, result, prosodyWords, empty } = useMemo(() => {
    if (mode === "shadowing") {
      const items = listShadowing(level);
      const first = items[0];
      if (!first) {
        return {
          annotation: THANK_YOU_ANNOTATION,
          result: THANK_YOU_DEMO,
          prosodyWords: ["Thank", "you", "ˈver-", "much"],
          empty: true,
        };
      }
      // Prefer rich thank-you mock when first item IS thank-you; else first item
      const isThankYou = first.id === "l1-s05" || first.text.startsWith("Thank you");
      if (isThankYou) {
        return {
          annotation: THANK_YOU_ANNOTATION,
          result: THANK_YOU_DEMO,
          prosodyWords: ["Thank", "you", "ˈver-", "much"],
          empty: false,
        };
      }
      return {
        annotation: annotationFromWords(first.text, first.gloss, first.words),
        result: mockFromWords(first.words, 82),
        prosodyWords: first.words.map((w) => w.word.replace(/[.,!?]$/, "")),
        empty: false,
      };
    }

    const dialogues = listDialogues(level);
    const first = dialogues[0];
    if (!first) {
      return {
        annotation: THANK_YOU_ANNOTATION,
        result: THANK_YOU_DEMO,
        prosodyWords: ["Thank", "you", "ˈver-", "much"],
        empty: true,
      };
    }
    const turn = first.turns.find((t) => t.speaker === "you") ?? first.turns[0];
    return {
      annotation: annotationFromWords(turn.text, turn.gloss, turn.words),
      result: mockFromWords(turn.words, 82),
      prosodyWords: turn.words.map((w) => w.word.replace(/[.,!?]$/, "")),
      empty: false,
    };
  }, [level, mode]);

  if (empty) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-14">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-800">
          ← 返回
        </Link>
        <p className="mt-6 text-zinc-600">该级别暂无课程内容。</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10">
      <header className="flex items-center justify-between gap-4">
        <Link href="/" className="text-sm text-zinc-500 transition hover:text-zinc-800">
          ← 返回
        </Link>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1">
            {levelMeta?.id ?? level}
          </span>
          <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1">
            {modeMeta?.labelZh ?? mode}
          </span>
        </div>
      </header>

      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm md:p-8">
        <IpaGuide annotation={annotation} />
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500">
        <button
          type="button"
          className="rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-100"
        >
          ▶ 范读
        </button>
        <button
          type="button"
          className="rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-rose-600"
        >
          ● 录音
        </button>
        <span className="text-xs text-zinc-500">Demo · 反馈始终可见</span>
      </div>

      <FeedbackPanel result={result} audioUrl={null} referenceText={annotation.text} prosodyWords={prosodyWords} />
    </div>
  );
}

export default function PracticePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-14 text-zinc-500">加载中…</div>
      }
    >
      <PracticeInner />
    </Suspense>
  );
}
