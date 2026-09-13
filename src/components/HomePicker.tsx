"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LEVELS, MODES, listDialogues, listShadowing } from "@/lib/curriculum";
import type { Level, Mode } from "@/lib/types";

export function HomePicker() {
  const router = useRouter();
  const [level, setLevel] = useState<Level | null>(null);
  const [mode, setMode] = useState<Mode | null>(null);

  const enterPractice = (nextLevel: Level, nextMode: Mode) => {
    const items =
      nextMode === "shadowing"
        ? listShadowing(nextLevel)
        : listDialogues(nextLevel);
    if (items.length === 0) return;
    router.push(`/practice?level=${nextLevel}&mode=${nextMode}`);
  };

  const onSelectLevel = (id: Level) => {
    setLevel(id);
    if (mode) enterPractice(id, mode);
  };

  const onSelectMode = (id: Mode) => {
    setMode(id);
    if (level) enterPractice(level, id);
  };

  const emptyHint =
    level && mode
      ? mode === "dialogue" && listDialogues(level).length === 0
        ? "该级别暂无对话，试试 L2 或切换到跟读。"
        : mode === "shadowing" && listShadowing(level).length === 0
          ? "该级别暂无跟读句，试试其他级别。"
          : null
      : null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 py-14">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Englist · Oral Lab</p>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 md:text-5xl">
          英语口语练习
        </h1>
        <p className="max-w-xl text-base leading-relaxed text-zinc-600">
          选择级别与模式，直接进入视觉纠正练习。音素级反馈 · Mock 引擎默认可用。
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-500">级别 Level</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {LEVELS.map((l) => {
            const active = level === l.id;
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => onSelectLevel(l.id)}
                className={`rounded-2xl border p-4 text-left transition ${
                  active
                    ? "border-zinc-400 bg-zinc-100 shadow-sm"
                    : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
                }`}
              >
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-medium text-zinc-900">{l.id}</span>
                  <span className="text-xs text-zinc-500">{l.labelZh}</span>
                </div>
                <p className="mt-2 text-sm text-zinc-500">{l.hint}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-500">模式 Mode</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {MODES.map((m) => {
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onSelectMode(m.id)}
                className={`rounded-2xl border p-4 text-left transition ${
                  active
                    ? "border-zinc-400 bg-zinc-100 shadow-sm"
                    : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
                }`}
              >
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-medium text-zinc-900">{m.labelZh}</span>
                  <span className="text-xs text-zinc-500">{m.label}</span>
                </div>
                <p className="mt-2 text-sm text-zinc-500">{m.hint}</p>
              </button>
            );
          })}
        </div>
      </section>

      {emptyHint && (
        <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
          {emptyHint}
        </p>
      )}

      {!level || !mode ? (
        <p className="text-sm text-zinc-500">
          {!level && !mode
            ? "请先选择级别，再选择模式进入练习。"
            : !level
              ? "再选一个级别即可开始。"
              : "再选一个模式即可开始。"}
        </p>
      ) : null}

      <footer className="border-t border-zinc-200 pt-6 text-xs text-zinc-500">
        Perfect ≥ 90 · Good ≥ 75 · 低于 75 仅显示纠正 · PronunciationProvider: mock
      </footer>
    </div>
  );
}
