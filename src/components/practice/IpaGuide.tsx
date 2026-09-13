"use client";

import type { SentenceAnnotation } from "@/lib/annotations";

type Props = {
  annotation: SentenceAnnotation;
  showLegend?: boolean;
};

/**
 * IPA line: one font, one size. Each word in its own /…/.
 * Format: /həˈloʊ/ /haʊ/ /ər/ /ju/ /təˈdeɪ/
 */
export function IpaGuide({ annotation, showLegend = true }: Props) {
  /** Per-word IPA: /həˈloʊ/ /haʊ/ /ər/ … */
  const ipaLine = annotation.tokens.map((t) => `/${t.text}/`).join(" ");

  return (
    <div className="space-y-4">
      <p className="text-2xl font-semibold tracking-tight text-zinc-900 md:text-3xl">
        {annotation.text}
      </p>
      {annotation.gloss && (
        <p className="text-sm text-zinc-500">{annotation.gloss}</p>
      )}

      <p
        className="text-zinc-700"
        style={{
          fontFamily: "'Englist IPA', 'Noto Sans', sans-serif",
          fontSize: "1.125rem",
          fontWeight: 500,
          lineHeight: 1.75,
          letterSpacing: "0.04em",
          fontVariantLigatures: "none",
        }}
      >
        {ipaLine}
      </p>

      {showLegend && (
        <p className="text-[11px] text-zinc-500">
          音标为美式 IPA；每个词单独用 /…/，词与词之间空格分开；ˈ 表示重音。
        </p>
      )}
    </div>
  );
}
