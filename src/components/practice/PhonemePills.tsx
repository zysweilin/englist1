"use client";

import type { PhonemeFeedback } from "@/lib/types";
import { scoreBg, scoreColor } from "@/lib/scoreColor";

type Props = {
  phonemes: PhonemeFeedback[];
};

export function PhonemePills({ phonemes }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {phonemes.map((p, i) => {
        const mismatch = p.expectedIpa !== p.heardIpa;
        return (
          <div
            key={`${p.expectedIpa}-${i}`}
            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${scoreBg(p.score)}`}
          >
            <span className={scoreColor(p.score)}>/{p.expectedIpa}/</span>
            <span className="mx-1 text-zinc-600">→</span>
            <span className={mismatch ? "text-rose-300" : "text-zinc-300"}>
              /{p.heardIpa}/
            </span>
            <span className="ml-1.5 text-zinc-500">{p.score}</span>
          </div>
        );
      })}
    </div>
  );
}
