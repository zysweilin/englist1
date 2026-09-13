"use client";

import { useMemo, useState } from "react";
import type { PronunciationResult } from "@/lib/types";
import {
  oneLineReason,
  pickWorstCorrections,
} from "@/lib/annotations";
import { scoreColor, scoreLabel } from "@/lib/scoreColor";
import { PhonemePills } from "./PhonemePills";
import { ProsodyChart } from "./ProsodyChart";
import { CorrectionSummary } from "./CorrectionSummary";

type Props = {
  result: PronunciationResult;
  audioUrl: string | null;
  /** Optional word labels for prosody chart. */
  prosodyWords?: string[];
};

export function FeedbackPanel({ result, audioUrl: _audioUrl, prosodyWords }: Props) {
  const [showPills, setShowPills] = useState(false);

  const issues = useMemo(
    () => pickWorstCorrections(result, { max: 3, threshold: 70 }),
    [result],
  );
  const reason = useMemo(() => oneLineReason(result, issues), [result, issues]);

  const chartWords =
    prosodyWords ?? result.words.map((w) => w.word.replace(/\.$/, ""));

  return (
    <div className="space-y-5 rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-5">
      {/* Score + one-line reason */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">反馈 Feedback</p>
          <div className="mt-1 flex items-baseline gap-3">
            <span
              className={`text-4xl font-semibold tabular-nums ${scoreColor(result.overallScore)}`}
            >
              {result.overallScore}
            </span>
            <span className="text-sm text-zinc-400">{scoreLabel(result.overallScore)}</span>
          </div>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-400">{reason}</p>
        </div>
        <span className="rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-500">
          provider: {result.provider}
        </span>
      </div>

      <ProsodyChart words={chartWords} />

      {/* Color words */}
      <div className="flex flex-wrap gap-x-3 gap-y-2">
        {result.words.map((w, i) => (
          <div key={`${w.word}-${i}`} className="rounded-lg px-2 py-1">
            <span className={`text-lg font-medium ${scoreColor(w.score)}`}>{w.word}</span>
            <span className="mt-0.5 block font-mono text-[11px] text-zinc-500">/{w.ipa}/</span>
          </div>
        ))}
      </div>

      <CorrectionSummary items={issues} />

      {/* Optional: full phoneme pills */}
      <div>
        <button
          type="button"
          onClick={() => setShowPills((v) => !v)}
          className="text-xs text-zinc-500 underline-offset-2 hover:text-zinc-300 hover:underline"
        >
          {showPills ? "收起全部音素" : "展开全部音素"}
        </button>
        {showPills && (
          <div className="mt-3 space-y-3">
            {result.words.map((w, i) => (
              <div
                key={`pills-${w.word}-${i}`}
                className="rounded-xl border border-zinc-800 bg-black/40 p-3"
              >
                <p className="mb-2 text-sm text-zinc-400">
                  {w.word}{" "}
                  <span className={`tabular-nums ${scoreColor(w.score)}`}>{w.score}</span>
                </p>
                <PhonemePills phonemes={w.phonemes} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
