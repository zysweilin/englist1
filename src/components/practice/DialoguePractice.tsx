"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { DialogueItem, PronunciationResult } from "@/lib/types";
import { useTTS } from "@/hooks/useTTS";
import { useRecorder } from "@/hooks/useRecorder";
import { SentenceDisplay } from "./SentenceDisplay";
import { RecordControls } from "./RecordControls";
import { FeedbackPanel } from "./FeedbackPanel";

type Props = {
  item: DialogueItem;
  prevId?: string;
  nextId?: string;
};

type TurnState = {
  done: boolean;
  result?: PronunciationResult;
  audioUrl?: string | null;
};

export function DialoguePractice({ item, prevId, nextId }: Props) {
  const { speak, stop, speaking } = useTTS();
  const recorder = useRecorder();
  const [turnIndex, setTurnIndex] = useState(0);
  const [states, setStates] = useState<TurnState[]>(() =>
    item.turns.map(() => ({ done: false })),
  );
  const [analyzing, setAnalyzing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [autoPlayed, setAutoPlayed] = useState<number | null>(null);

  const current = item.turns[turnIndex];
  const allDone = useMemo(() => states.every((s) => s.done), [states]);

  // Unlock: future turns locked until current done; advance past partner turns.
  useEffect(() => {
    if (!current) return;
    if (current.speaker === "partner" && !states[turnIndex]?.done) {
      if (autoPlayed !== turnIndex) {
        speak(current.text);
        setAutoPlayed(turnIndex);
      }
    }
  }, [current, turnIndex, states, speak, autoPlayed]);

  const markPartnerDone = useCallback(() => {
    setStates((prev) => {
      const next = [...prev];
      next[turnIndex] = { done: true };
      return next;
    });
    setTurnIndex((i) => Math.min(i + 1, item.turns.length - 1));
    recorder.reset();
    setApiError(null);
  }, [item.turns.length, recorder, turnIndex]);

  const onPlayTTS = () => {
    if (!current) return;
    if (speaking) stop();
    else speak(current.text);
  };

  const onRecordToggle = () => {
    if (recorder.state === "recording") recorder.stop();
    else {
      void recorder.start();
    }
  };

  const onAnalyze = useCallback(async () => {
    if (!recorder.blob || !current || current.speaker !== "you") return;
    setAnalyzing(true);
    setApiError(null);
    try {
      const form = new FormData();
      form.append("audio", recorder.blob, "take.webm");
      form.append(
        "reference",
        JSON.stringify({ text: current.text, words: current.words }),
      );
      form.append("provider", "mock");
      const res = await fetch("/api/pronounce", { method: "POST", body: form });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as PronunciationResult;
      const audioUrl = recorder.url;
      setStates((prev) => {
        const next = [...prev];
        next[turnIndex] = { done: true, result: data, audioUrl };
        return next;
      });
      // Advance to next turn if any
      setTurnIndex((i) => Math.min(i + 1, item.turns.length - 1));
      recorder.reset();
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "分析失败");
    } finally {
      setAnalyzing(false);
    }
  }, [current, item.turns.length, recorder, turnIndex]);

  const onReset = () => {
    recorder.reset();
    setApiError(null);
  };

  if (!current) return null;

  const locked = (idx: number) => idx > turnIndex;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10">
      <header className="flex items-center justify-between gap-4">
        <Link href="/" className="text-sm text-zinc-500 transition hover:text-zinc-300">
          ← 返回首页
        </Link>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="rounded-full border border-zinc-800 px-2.5 py-1">{item.level}</span>
          <span className="rounded-full border border-zinc-800 px-2.5 py-1">对话</span>
        </div>
      </header>

      <div>
        <h1 className="text-2xl font-semibold text-zinc-100">
          {item.titleZh}{" "}
          <span className="text-base font-normal text-zinc-500">{item.title}</span>
        </h1>
        <p className="mt-1 text-sm text-zinc-500">{item.scenario}</p>
      </div>

      <div className="space-y-3">
        {item.turns.map((turn, idx) => {
          const isCurrent = idx === turnIndex && !allDone;
          const isLocked = locked(idx) && !allDone;
          const st = states[idx];
          return (
            <div
              key={turn.id}
              className={`rounded-2xl border p-4 transition ${
                isCurrent
                  ? "border-zinc-600 bg-zinc-950"
                  : isLocked
                    ? "border-zinc-900 bg-black/40 opacity-40"
                    : "border-zinc-800/60 bg-zinc-950/50"
              }`}
            >
              <div className="mb-2 flex items-center gap-2 text-xs">
                <span
                  className={`rounded-full px-2 py-0.5 ${
                    turn.speaker === "partner"
                      ? "bg-indigo-500/15 text-indigo-300"
                      : "bg-emerald-500/15 text-emerald-300"
                  }`}
                >
                  {turn.speaker === "partner" ? "搭档 Partner" : "你 You"}
                </span>
                {st.done && <span className="text-zinc-600">✓ 完成</span>}
                {isLocked && <span className="text-zinc-600">🔒 未解锁</span>}
                {isCurrent && <span className="text-zinc-400">当前回合</span>}
              </div>

              {(isCurrent || st.done || (!isLocked && idx < turnIndex)) && (
                <>
                  <SentenceDisplay text={turn.text} gloss={turn.gloss} words={turn.words} />
                  {st.result && (
                    <div className="mt-4">
                      <FeedbackPanel result={st.result} audioUrl={st.audioUrl ?? null} referenceText={turn.text} />
                    </div>
                  )}
                </>
              )}

              {isLocked && (
                <p className="text-sm text-zinc-600">完成当前回合后解锁…</p>
              )}
            </div>
          );
        })}
      </div>

      {!allDone && current.speaker === "partner" && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <p className="text-sm text-zinc-400">听搭档说话，然后继续。</p>
          <button
            type="button"
            onClick={onPlayTTS}
            className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
          >
            {speaking ? "停止 ▶" : "再听一遍 ▶"}
          </button>
          <button
            type="button"
            onClick={markPartnerDone}
            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200"
          >
            我听完了 →
          </button>
        </div>
      )}

      {!allDone && current.speaker === "you" && (
        <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <p className="text-sm text-zinc-400">轮到你了。先听示范，再录音跟读。</p>
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
            analyzeLabel="提交本轮"
          />
          {recorder.url && (
            <audio controls src={recorder.url} className="w-full opacity-80" />
          )}
        </div>
      )}

      {allDone && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center">
          <p className="text-lg font-medium text-emerald-300">对话完成 🎉</p>
          <p className="mt-1 text-sm text-zinc-400">可以回看各轮反馈，或进入下一场景。</p>
        </div>
      )}

      <nav className="flex items-center justify-between border-t border-zinc-900 pt-6 text-sm">
        {prevId ? (
          <Link href={`/dialogue/${prevId}`} className="text-zinc-400 hover:text-zinc-200">
            ← 上一场景
          </Link>
        ) : (
          <span />
        )}
        {nextId ? (
          <Link href={`/dialogue/${nextId}`} className="text-zinc-400 hover:text-zinc-200">
            下一场景 →
          </Link>
        ) : (
          <span className="text-zinc-600">本级完成</span>
        )}
      </nav>
    </div>
  );
}
