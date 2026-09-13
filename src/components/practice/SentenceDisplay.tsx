"use client";

import type { WordUnit } from "@/lib/types";

type Props = {
  text: string;
  gloss?: string;
  words: WordUnit[];
  large?: boolean;
};

export function SentenceDisplay({ text, gloss, words, large }: Props) {
  return (
    <div className="space-y-4">
      <p
        className={`font-medium tracking-tight text-zinc-100 ${
          large ? "text-3xl leading-snug md:text-4xl" : "text-2xl leading-snug"
        }`}
      >
        {text}
      </p>
      <div className="flex flex-wrap gap-x-3 gap-y-3">
        {words.map((w, i) => (
          <div key={`${w.word}-${i}`} className="min-w-[2.5rem] text-center">
            <div className="text-base text-zinc-200">{w.word}</div>
            <div className="mt-1 font-mono text-xs text-zinc-500">/{w.ipa}/</div>
          </div>
        ))}
      </div>
      {gloss && <p className="text-sm text-zinc-500">{gloss}</p>}
    </div>
  );
}
