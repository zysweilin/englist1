"use client";

import type { CorrectionItem } from "@/lib/annotations";

type Props = {
  items: CorrectionItem[];
  title?: string;
};

export function CorrectionSummary({
  items,
  title = "本句优先改这几点",
}: Props) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
        <p className="text-sm text-emerald-400/90">音素基本到位，继续保持。</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
        纠正总结 · <span className="normal-case tracking-normal text-zinc-400">{title}</span>
      </p>
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={`${item.expectedIpa}-${i}`} className="space-y-1">
            <div className="flex flex-wrap items-baseline gap-2 font-mono text-sm">
              <span className="text-zinc-500">目标</span>
              <span className="text-emerald-400">/{item.expectedIpa}/</span>
              <span className="text-zinc-600">→</span>
              <span className="text-zinc-500">你发成</span>
              <span className="text-rose-400">/{item.heardIpa}/</span>
              {item.word && (
                <span className="ml-1 rounded bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-500">
                  {item.word}
                </span>
              )}
            </div>
            <p className="text-sm leading-relaxed text-zinc-400">{item.tipZh}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
