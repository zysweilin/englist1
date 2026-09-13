"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import type { PronunciationResult, ShadowingItem } from "@/lib/types";
import { useTTS } from "@/hooks/useTTS";
import { useRecorder } from "@/hooks/useRecorder";
import { SentenceDisplay } from "./SentenceDisplay";
import { RecordControls } from "./RecordControls";
import { FeedbackPanel } from "./FeedbackPanel";

type Props = {
  item: ShadowingItem;
  prevId?: string;
  nextId?: string;
};

export function ShadowingPractice({ item, prevId, nextId }: Props) {
  const { speak, stop, speaking } = useTTS();
  const recorder = useRecorder();
  const [result, setResult] = useState<PronunciationResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const onPlayTTS = () => {
    if (speaking) stop();
    else speak(item.text);
  };

  const onRecordToggle = () => {
    if (recorder.state === "recording") recorder.stop();
    else {
      setResult(null);
      void recorder.start();
    }
  };

  const onAnalyze = useCallback(async () => {
    if (!recorder.blob) return;
    setAnalyzing(true);
    setApiError(null);
    try {
      const form = new FormData();
      form.append("audio", recorder.blob, "take.webm");
      form.append(
        "reference",
        JSON.stringify({ text: item.text, words: item.words }),
      );
      form.append("provider", "mock");
      const res = await fetch("/api/pronounce", { method: "POST", body: form });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as PronunciationResult;
      setResult(data);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "分析失败");
    } finally {
      setAnalyzing(false);
    }
  }, [item.text, item.words, recorder.blob]);

  const onReset = () => {
    recorder.reset();
    setResult(null);
    setApiError(null);
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10">
      <header className="flex items-center justify-between gap-4">
        <Link href="/" className="text-sm text-zinc-500 transition hover:text-zinc-300">
          ← 返回首页
        </Link>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="rounded-full border border-zinc-800 px-2.5 py-1">{item.level}</span>
          <span className="rounded-full border border-zinc-800 px-2.5 py-1">跟读</span>
        </div>
      </header>

      <div className="min-h-[220px] rounded-3xl border border-zinc-800/80 bg-gradient-to-b from-zinc-950 to-black p-8 md:p-10">
        <SentenceDisplay text={item.text} gloss={item.gloss} words={item.words} large />
      </div>

      <RecordControls
        recording={recorder.state === "recording"}
        ready={recorder.state === "ready"}
        analyzing={analyzing}
        level={recorder.level}
        elapsedMs={recorder.elapsedMs}
        error={recorder.error || apiError}
        onPlayTTS={onPlayTTS}
        ttsSpeaking={speaking}
        onRecordToggle={onRecordToggle}
        onAnalyze={onAnalyze}
        onReset={onReset}
      />

      {recorder.url && (
        <audio controls src={recorder.url} className="w-full opacity-80" />
      )}

      {result && <FeedbackPanel result={result} audioUrl={recorder.url} />}

      <nav className="flex items-center justify-between border-t border-zinc-900 pt-6 text-sm">
        {prevId ? (
          <Link href={`/shadowing/${prevId}`} className="text-zinc-400 hover:text-zinc-200">
            ← 上一句
          </Link>
        ) : (
          <span />
        )}
        {nextId ? (
          <Link href={`/shadowing/${nextId}`} className="text-zinc-400 hover:text-zinc-200">
            下一句 →
          </Link>
        ) : (
          <span className="text-zinc-600">本级完成 🎉</span>
        )}
      </nav>
    </div>
  );
}
