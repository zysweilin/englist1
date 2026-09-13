"use client";

import { useState } from "react";
import type { PronunciationResult } from "@/lib/types";
import { scoreColor, scoreLabel } from "@/lib/scoreColor";
import { PhonemePills } from "./PhonemePills";
import { SegmentBar } from "./SegmentBar";

type Props = {
  result: PronunciationResult;
  audioUrl: string | null;
};

export function FeedbackPanel({ result, audioUrl }: Props) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="space-y-6 rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">反馈 Feedback</p>
          <div className="mt-1 flex items-baseline gap-3">
            <span className={`text-4xl font-semibold tabular-nums ${scoreColor(result.overallScore)}`}>
              {result.overallScore}
            </span>
            <span className="text-sm text-zinc-400">{scoreLabel(result.overallScore)}</span>
          </div>
        </div>
        <span className="rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-500">
          provider: {result.provider}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-2">
        {result.words.map((w, i) => (
          <button
            key={`${w.word}-${i}`}
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className={`rounded-lg px-2 py-1 text-left transition ${
              open === i ? "bg-zinc-800/80" : "hover:bg-zinc-900"
            }`}
          >
            <span className={`text-lg font-medium ${scoreColor(w.score)}`}>{w.word}</span>
            <span className="mt-0.5 block font-mono text-[11px] text-zinc-500">/{w.ipa}/</span>
          </button>
        ))}
      </div>

      {open != null && result.words[open] && (
        <div className="space-y-3 rounded-xl border border-zinc-800 bg-black/40 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-300">
              音素 · <span className="font-medium text-zinc-100">{result.words[open].word}</span>
            </p>
            <span className={`text-sm tabular-nums ${scoreColor(result.words[open].score)}`}>
              {result.words[open].score}
            </span>
          </div>
          <PhonemePills phonemes={result.words[open].phonemes} />
        </div>
      )}

      <SegmentBar words={result.words} durationMs={result.durationMs} audioUrl={audioUrl} />

      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">教练提示 Tips</p>
        <ul className="space-y-2">
          {result.tips.map((tip, i) => (
            <li
              key={i}
              className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-4 py-3 text-sm leading-relaxed text-zinc-300"
            >
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
