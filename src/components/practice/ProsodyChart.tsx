"use client";

type Props = {
  words?: string[];
  native?: number[];
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

function PitchPane({
  label,
  badgeClass,
  stroke,
  dashed,
  samples,
  words,
}: {
  label: string;
  badgeClass: string;
  stroke: string;
  dashed?: boolean;
  samples: number[];
  words: string[];
}) {
  const W = 400;
  const H = 88;
  const padY = 10;
  const path = toPath(samples, W, H, padY);

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 pb-2 pt-3">
      <div className="mb-2 flex items-center justify-between">
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${badgeClass}`}>
          {label}
        </span>
      </div>
      <div className="mb-1 flex justify-between px-1 text-[11px] text-zinc-500">
        {words.map((w, i) => (
          <span key={`${label}-${w}-${i}`} className="font-mono">
            {w}
          </span>
        ))}
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-20 w-full"
        role="img"
        aria-label={label}
      >
        {[0.25, 0.5, 0.75].map((g) => (
          <line
            key={g}
            x1={0}
            x2={W}
            y1={padY + (1 - g) * (H - padY * 2)}
            y2={padY + (1 - g) * (H - padY * 2)}
            stroke="#e4e4e7"
            strokeDasharray="3 4"
          />
        ))}
        <path
          d={path}
          fill="none"
          stroke={stroke}
          strokeWidth="2.25"
          strokeDasharray={dashed ? "5 4" : undefined}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.95"
        />
      </svg>
    </div>
  );
}

export function ProsodyChart({
  words = ["Thank", "ˈyou", "ˈver-", "much"],
  native = DEFAULT_NATIVE,
  learner = DEFAULT_LEARNER,
  className = "",
}: Props) {
  return (
    <div className={`space-y-3 ${className}`}>
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">韵律 Prosody</p>
      {/* Correct first, then user stacked below */}
      <PitchPane
        label="正确 Correct · 范读"
        badgeClass="bg-emerald-100 text-emerald-700"
        stroke="#059669"
        dashed
        samples={native}
        words={words}
      />
      <PitchPane
        label="你的 Yours"
        badgeClass="bg-zinc-100 text-zinc-600"
        stroke="#d97706"
        samples={learner}
        words={words}
      />
    </div>
  );
}
