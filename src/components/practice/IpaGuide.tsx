"use client";

import type { SentenceAnnotation } from "@/lib/annotations";

type Props = {
  annotation: SentenceAnnotation;
  /** Show tiny legend under the IPA row. */
  showLegend?: boolean;
};

const kindClass: Record<string, string> = {
  content: "text-emerald-400/85",
  weak: "text-sky-400",
  other: "text-zinc-400",
};

export function IpaGuide({ annotation, showLegend = true }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-2xl font-medium tracking-tight text-zinc-100 md:text-3xl">
        {annotation.text}
      </p>
      {annotation.gloss && (
        <p className="text-sm text-zinc-500">{annotation.gloss}</p>
      )}

      <div className="overflow-x-auto">
        <div className="inline-flex min-w-full items-end gap-1 font-mono text-base md:text-lg">
          <span className="pb-3 text-zinc-600">/</span>
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
                    stroke="rgb(56 189 248)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    opacity="0.85"
                  />
                </svg>
              )}
              <span className={`pb-3 leading-none ${kindClass[tok.kind] ?? kindClass.other}`}>
                {tok.text.includes("ˈ") ? (
                  <>
                    <span className="text-amber-400">ˈ</span>
                    {tok.text.replace("ˈ", "")}
                  </>
                ) : (
                  tok.text
                )}
              </span>
            </span>
          ))}
          <span className="pb-3 text-zinc-600">/</span>
        </div>
      </div>

      {showLegend && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="font-mono text-amber-400">ˈ</span>
            重读
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="text-sky-400">‿</span>
            连读
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
            弱读
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
            实词
          </span>
        </div>
      )}
    </div>
  );
}
