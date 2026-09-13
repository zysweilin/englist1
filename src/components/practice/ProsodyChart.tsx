"use client";

type Props = {
  /** Word labels under / above the chart. */
  words?: string[];
  /** Native pitch samples 0–1. */
  native?: number[];
  /** Learner pitch samples 0–1. */
  learner?: number[];
  className?: string;
};

const DEFAULT_NATIVE = [
  0.32, 0.38, 0.55, 0.72, 0.48, 0.36, 0.42, 0.78, 0.85, 0.62, 0.4, 0.35, 0.38, 0.42,
];
const DEFAULT_LEARNER = [
  0.4, 0.42, 0.44, 0.46, 0.43, 0.41, 0.42, 0.48, 0.5, 0.46, 0.43, 0.41, 0.4, 0.42,
];

function toPath(samples: number[], w: number, h: number, padY: number): string {
  if (samples.length < 2) return "";
  const usableH = h - padY * 2;
  return samples
    .map((v, i) => {
      const x = (i / (samples.length - 1)) * w;
      const y = padY + (1 - v) * usableH;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

export function ProsodyChart({
  words = ["Thank", "ˈyou", "ˈver-", "much"],
  native = DEFAULT_NATIVE,
  learner = DEFAULT_LEARNER,
  className = "",
}: Props) {
  const W = 400;
  const H = 110;
  const padY = 12;
  const nativePath = toPath(native, W, H, padY);
  const learnerPath = toPath(learner, W, H, padY);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">韵律 Prosody</p>
        <div className="flex items-center gap-3 text-[11px] text-zinc-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-px w-4 border-t border-dashed border-emerald-400" />
            范读
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4 bg-amber-400" />
            你的
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800/80 bg-black/30 px-3 pb-2 pt-3">
        {/* Word labels */}
        <div className="mb-1 flex justify-between px-1 text-[11px] text-zinc-500">
          {words.map((w, i) => (
            <span key={`${w}-${i}`} className="font-mono">
              {w}
            </span>
          ))}
        </div>

        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-24 w-full"
          role="img"
          aria-label="Pitch comparison: native vs learner"
        >
          {/* Grid */}
          {[0.25, 0.5, 0.75].map((g) => (
            <line
              key={g}
              x1={0}
              x2={W}
              y1={padY + (1 - g) * (H - padY * 2)}
              y2={padY + (1 - g) * (H - padY * 2)}
              stroke="#27272a"
              strokeDasharray="3 4"
            />
          ))}
          {/* Native dashed */}
          <path
            d={nativePath}
            fill="none"
            stroke="#34d399"
            strokeWidth="2"
            strokeDasharray="5 4"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.9"
          />
          {/* Learner solid */}
          <path
            d={learnerPath}
            fill="none"
            stroke="#fbbf24"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.95"
          />
        </svg>
      </div>
    </div>
  );
}
