"use client";

import type { SentenceAnnotation } from "@/lib/annotations";

type Props = {
  annotation: SentenceAnnotation;
  /** Show tiny legend under the IPA row. */
  showLegend?: boolean;
};

const kindClass: Record<string, string> = {
  content: "text-emerald-700",
  weak: "text-sky-600",
  other: "text-zinc-500",
};

/** Render IPA token with stress marks colored but same font size as letters. */
function renderIpa(text: string) {
  const parts: { t: string; stress: boolean }[] = [];
  let buf = "";
  for (const ch of text) {
    if (ch === "ˈ" || ch === "ˌ") {
      if (buf) {
        parts.push({ t: buf, stress: false });
        buf = "";
      }
      parts.push({ t: ch, stress: true });
    } else {
      buf += ch;
    }
  }
  if (buf) parts.push({ t: buf, stress: false });

  return parts.map((p, i) =>
    p.stress ? (
      <span key={i} className="text-amber-600">
        {p.t}
      </span>
    ) : (
      <span key={i}>{p.t}</span>
    ),
  );
}

export function IpaGuide({ annotation, showLegend = true }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-2xl font-semibold tracking-tight text-zinc-900 md:text-3xl">
        {annotation.text}
      </p>
      {annotation.gloss && (
        <p className="text-sm text-zinc-500">{annotation.gloss}</p>
      )}

      <div className="overflow-x-auto">
        {/* All IPA tokens share one font size; stress ˈ/ˌ are not enlarged */}
        <div className="inline-flex min-w-full items-center gap-1 font-mono text-lg font-semibold leading-none md:text-xl">
          <span className="text-zinc-400">/</span>
          {annotation.tokens.map((tok, i) => (
            <span key={`${tok.text}-${i}`} className="relative inline-flex flex-col items-center px-1">
              {/* Linking arc to next token */}
              {tok.linkAfter && (
                <svg
                  className="pointer-events-none absolute left-1/2 top-0 h-3 w-[calc(100%+0.5rem)] -translate-y-1"
                  viewBox="0 0 100 12"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  <path
                    d="M 8 10 Q 50 0 92 10"
                    fill="none"
                    stroke="rgb(2 132 199)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    opacity="0.85"
                  />
                </svg>
              )}
              <span className={`py-1 ${kindClass[tok.kind] ?? kindClass.other}`}>
                {renderIpa(tok.text)}
              </span>
            </span>
          ))}
          <span className="text-zinc-400">/</span>
        </div>
      </div>

      {showLegend && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="font-mono text-amber-600">ˈ</span>
            重读
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="text-sky-600">‿</span>
            连读
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
            弱读
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            实词
          </span>
        </div>
      )}
    </div>
  );
}
