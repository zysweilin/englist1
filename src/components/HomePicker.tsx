"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LEVELS, MODES, listDialogues, listShadowing } from "@/lib/curriculum";
import type { Level, Mode } from "@/lib/types";

export function HomePicker() {
  const [level, setLevel] = useState<Level>("L1");
  const [mode, setMode] = useState<Mode>("shadowing");

  const shadowing = useMemo(() => listShadowing(level), [level]);
  const dialogues = useMemo(() => listDialogues(level), [level]);
  const count = mode === "shadowing" ? shadowing.length : dialogues.length;

  const emptyHint =
    mode === "dialogue" && dialogues.length === 0
      ? "该级别暂无对话，试试 L2 或切换到跟读。"
      : mode === "shadowing" && shadowing.length === 0
        ? "该级别暂无跟读句，试试其他级别。"
        : null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 py-14">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Englist · Oral Lab</p>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-50 md:text-5xl">
          英语口语练习
        </h1>
        <p className="max-w-xl text-base leading-relaxed text-zinc-400">
          跟读与对话，音素级反馈。默认 Mock 引擎，无需 API Key。安静、专注，像和 Grok 练口语一样。
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
                onClick={() => setLevel(l.id)}
                className={`rounded-2xl border p-4 text-left transition ${
                  active
                    ? "border-zinc-500 bg-zinc-900"
                    : "border-zinc-800 bg-zinc-950/50 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-medium text-zinc-100">{l.id}</span>
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
                onClick={() => setMode(m.id)}
                className={`rounded-2xl border p-4 text-left transition ${
                  active
                    ? "border-zinc-500 bg-zinc-900"
                    : "border-zinc-800 bg-zinc-950/50 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-medium text-zinc-100">{m.labelZh}</span>
                  <span className="text-xs text-zinc-500">{m.label}</span>
                </div>
                <p className="mt-2 text-sm text-zinc-500">{m.hint}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-500">课程 Curriculum</h2>
          <span className="text-xs text-zinc-600">
            {count} 项 · {mode === "shadowing" ? "跟读" : "对话"}
          </span>
        </div>

        {emptyHint && (
          <p className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-500">
            {emptyHint}
          </p>
        )}

        <ul className="divide-y divide-zinc-900 overflow-hidden rounded-2xl border border-zinc-800">
          {mode === "shadowing" &&
            shadowing.map((it, idx) => (
              <li key={it.id}>
                <Link
                  href={`/shadowing/${it.id}`}
                  className="flex items-start gap-4 px-4 py-4 transition hover:bg-zinc-900/60"
                >
                  <span className="mt-0.5 w-6 shrink-0 font-mono text-xs text-zinc-600">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-100">{it.text}</p>
                    <p className="mt-0.5 truncate text-xs text-zinc-500">{it.gloss}</p>
                  </div>
                  <span className="shrink-0 text-zinc-600">→</span>
                </Link>
              </li>
            ))}

          {mode === "dialogue" &&
            dialogues.map((it, idx) => (
              <li key={it.id}>
                <Link
                  href={`/dialogue/${it.id}`}
                  className="flex items-start gap-4 px-4 py-4 transition hover:bg-zinc-900/60"
                >
                  <span className="mt-0.5 w-6 shrink-0 font-mono text-xs text-zinc-600">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-100">
                      {it.titleZh} · {it.title}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-zinc-500">{it.scenario}</p>
                  </div>
                  <span className="shrink-0 text-zinc-600">→</span>
                </Link>
              </li>
            ))}
        </ul>
      </section>

      <footer className="border-t border-zinc-900 pt-6 text-xs text-zinc-600">
        PronunciationProvider: mock（默认）· azure（无密钥时回退 mock）
      </footer>
    </div>
  );
}
