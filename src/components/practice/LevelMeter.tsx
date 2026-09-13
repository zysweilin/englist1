"use client";

type Props = {
  level: number;
  active?: boolean;
};

export function LevelMeter({ level, active }: Props) {
  const bars = 16;
  return (
    <div className="flex h-8 items-end gap-[3px]" aria-hidden>
      {Array.from({ length: bars }).map((_, i) => {
        const threshold = (i + 1) / bars;
        const lit = active && level >= threshold * 0.55;
        const hot = i > bars * 0.75;
        return (
          <div
            key={i}
            className={`w-1.5 rounded-sm transition-all duration-75 ${
              lit
                ? hot
                  ? "bg-rose-400"
                  : "bg-emerald-400"
                : "bg-zinc-800"
            }`}
            style={{ height: `${18 + (i / bars) * 70}%` }}
          />
        );
      })}
    </div>
  );
}
