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
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <p className="text-base text-emerald-700">音素基本到位，继续保持。</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/80 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
        纠正总结 · <span className="normal-case tracking-normal text-zinc-600">{title}</span>
      </p>
      <ul className="space-y-4">
        {items.map((item, i) => (
          <li key={`${item.expectedIpa}-${i}`} className="space-y-1.5">
            <div className="flex flex-wrap items-baseline gap-2 font-mono text-base font-semibold md:text-lg">
              <span className="text-sm font-normal text-zinc-500">目标</span>
              <span className="text-emerald-600">/{item.expectedIpa}/</span>
              <span className="text-zinc-400">→</span>
              <span className="text-sm font-normal text-zinc-500">你发成</span>
              <span className="text-rose-600">/{item.heardIpa}/</span>
              {item.word && (
                <span className="ml-1 rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-sans font-medium text-zinc-600">
                  {item.word}
                </span>
              )}
            </div>
            <p className="text-base font-medium leading-relaxed text-zinc-700 md:text-lg">
              {item.tipZh}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
