"use client";

import type { PhonemeFeedback, WordFeedback } from "@/lib/types";

type Props = {
  words: WordFeedback[];
};

/** Flat color only — no wave/score “起伏”. Light theme. */
function userTone(p: PhonemeFeedback): {
  cell: string;
  text: string;
} {
  const mismatch = p.expectedIpa !== p.heardIpa;
  if (mismatch) {
    return {
      cell: "border-rose-400 bg-rose-50",
      text: "text-rose-600",
    };
  }
  if (p.score < 85) {
    return {
      cell: "border-rose-200 bg-rose-50/70",
      text: "text-rose-400",
    };
  }
  return {
    cell: "border-emerald-300 bg-emerald-50",
    text: "text-emerald-700",
  };
}

const GRID =
  "grid grid-cols-[repeat(auto-fill,minmax(2.5rem,2.5rem))] gap-1.5";

/** Longer IPA labels (tʃ, aʊ, …) use slightly smaller text; cell size stays fixed. */
function labelTextClass(label: string): string {
  return label.length >= 2 ? "text-[11px]" : "text-sm";
}

function FlatCells({
  words,
  mode,
}: {
  words: WordFeedback[];
  mode: "correct" | "user";
}) {
  const cells: { key: string; label: string; cell: string; text: string }[] =
    [];

  words.forEach((w, wi) => {
    w.phonemes.forEach((p, pi) => {
      if (mode === "correct") {
        cells.push({
          key: `c-${wi}-${pi}-${p.expectedIpa}`,
          label: p.expectedIpa,
          cell: "border-emerald-300 bg-emerald-50",
          text: "text-emerald-700",
        });
      } else {
        const tone = userTone(p);
        cells.push({
          key: `u-${wi}-${pi}-${p.expectedIpa}`,
          label: p.heardIpa || p.expectedIpa,
          cell: tone.cell,
          text: tone.text,
        });
      }
    });
  });

  return (
    <div className={GRID}>
      {cells.map((c) => (
        <div
          key={c.key}
          className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border ${c.cell}`}
        >
          <span
            className={`font-mono font-semibold leading-none ${labelTextClass(c.label)} ${c.text}`}
          >
            /{c.label}/
          </span>
        </div>
      ))}
    </div>
  );
}

export function PhonemeStrip({ words }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">音素 Phonemes</p>

      <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-4">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
            正确 Correct
          </span>
        </div>
        <FlatCells words={words} mode="correct" />

        <div className="border-t border-zinc-200" />

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
            你的 Yours
          </span>
          <span className="text-[11px] text-zinc-500">
            绿=对 · 红=错 · 浅红=微欠
          </span>
        </div>
        <FlatCells words={words} mode="user" />
      </div>
    </div>
  );
}
