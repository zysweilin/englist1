"use client";

import { useMemo, useRef } from "react";
import type { PronunciationResult } from "@/lib/types";
import {
  oneLineReason,
  pickWorstCorrections,
} from "@/lib/annotations";
import { scoreColor } from "@/lib/scoreColor";
import { useTTS } from "@/hooks/useTTS";
import { GradeBadge } from "./GradeBadge";
import { PhonemeStrip } from "./PhonemeStrip";
import { ProsodyChart } from "./ProsodyChart";
import { CorrectionSummary } from "./CorrectionSummary";

type Props = {
  result: PronunciationResult;
  audioUrl: string | null;
  /** Optional word labels for prosody chart. */
  prosodyWords?: string[];
  /** Reference sentence for TTS 标准音. */
  referenceText?: string;
};

export function FeedbackPanel({
  result,
  audioUrl,
  prosodyWords,
  referenceText,
}: Props) {
  const issues = useMemo(
    () => pickWorstCorrections(result, { max: 3, threshold: 70 }),
    [result],
  );
  const reason = useMemo(() => oneLineReason(result, issues), [result, issues]);
  const { speak, speaking } = useTTS();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const chartWords =
    prosodyWords ?? result.words.map((w) => w.word.replace(/\.$/, ""));

  const ttsText =
    referenceText ??
    result.words.map((w) => w.word).join(" ").replace(/\s+([.,!?])/g, "$1");

  const playMine = () => {
    if (!audioUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
    } else {
      audioRef.current.src = audioUrl;
    }
    void audioRef.current.play();
  };

  return (
    <div className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      {/* Grade badge (qualitative only) + reason */}
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">反馈 Feedback</p>
        <GradeBadge score={result.overallScore} />
        <p className="max-w-lg text-base leading-relaxed text-zinc-600">{reason}</p>
      </div>

      {/* Play row */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => speak(ttsText)}
          className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3.5 py-1.5 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100"
          title="播放标准音"
        >
          ▶ {speaking ? "播放中…" : "标准音"}
        </button>
        <button
          type="button"
          onClick={playMine}
          disabled={!audioUrl}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
            audioUrl
              ? "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-100"
              : "cursor-not-allowed border-zinc-100 bg-zinc-50/60 text-zinc-400"
          }`}
          title={audioUrl ? "播放我的发音" : "暂无录音"}
        >
          ▶ 我的发音
        </button>
      </div>

      {/* Color words — larger IPA */}
      <div className="flex flex-wrap gap-x-4 gap-y-3">
        {result.words.map((w, i) => (
          <div key={`${w.word}-${i}`} className="rounded-lg px-1.5 py-0.5">
            <span className={`text-xl font-semibold md:text-2xl ${scoreColor(w.score)}`}>
              {w.word}
            </span>
            <span className="mt-1 block font-mono text-sm font-medium text-zinc-500">
              /{w.ipa}/
            </span>
          </div>
        ))}
      </div>

      {/* Full phoneme strip — always visible */}
      <PhonemeStrip words={result.words} />

      {/* Prosody stacked directly below phoneme strip */}
      <ProsodyChart words={chartWords} />

      <CorrectionSummary items={issues} />
    </div>
  );
}
