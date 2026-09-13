"use client";

import { LevelMeter } from "./LevelMeter";

type Props = {
  recording: boolean;
  ready: boolean;
  analyzing: boolean;
  level: number;
  elapsedMs: number;
  error: string | null;
  onPlayTTS: () => void;
  ttsSpeaking: boolean;
  onRecordToggle: () => void;
  onAnalyze: () => void;
  onReset: () => void;
  analyzeLabel?: string;
};

function formatMs(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function RecordControls({
  recording,
  ready,
  analyzing,
  level,
  elapsedMs,
  error,
  onPlayTTS,
  ttsSpeaking,
  onRecordToggle,
  onAnalyze,
  onReset,
  analyzeLabel = "看纠正",
}: Props) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onPlayTTS}
          className="rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:border-zinc-300 hover:bg-zinc-100"
        >
          {ttsSpeaking ? "停止 ▶" : "▶ 听示范"}
        </button>

        <button
          type="button"
          onClick={onRecordToggle}
          disabled={analyzing}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
            recording
              ? "bg-rose-500 text-white hover:bg-rose-400"
              : "bg-zinc-900 text-white hover:bg-zinc-800"
          } disabled:opacity-50`}
        >
          {recording ? "停止录音 ■" : "● 开始录音"}
        </button>

        <button
          type="button"
          onClick={onAnalyze}
          disabled={!ready || analyzing || recording}
          className="rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {analyzing ? "分析中…" : analyzeLabel}
        </button>

        <button
          type="button"
          onClick={onReset}
          className="rounded-full border border-zinc-200 px-3 py-2 text-sm text-zinc-500 hover:text-zinc-800"
        >
          重录
        </button>

        <div className="ml-auto flex items-center gap-3">
          <span className="font-mono text-xs tabular-nums text-zinc-500">
            {formatMs(elapsedMs)}
          </span>
          <LevelMeter level={level} active={recording} />
        </div>
      </div>
      {error && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}
      <p className="text-xs text-zinc-500">
        流程：听示范 → 录音 → 停止 → 点「看纠正」查看音素与韵律反馈。
      </p>
    </div>
  );
}
