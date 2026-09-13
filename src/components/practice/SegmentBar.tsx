"use client";

import { useEffect, useRef, useState } from "react";
import type { WordFeedback } from "@/lib/types";
import { scoreBar } from "@/lib/scoreColor";

type Props = {
  words: WordFeedback[];
  durationMs: number;
  audioUrl: string | null;
};

export function SegmentBar({ words, durationMs, audioUrl }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const total = Math.max(durationMs, 1);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const playSlice = (startMs: number, endMs: number, idx: number) => {
    if (!audioUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
    }
    const a = audioRef.current;
    a.pause();
    a.currentTime = startMs / 1000;
    setActiveIdx(idx);
    void a.play();
    const stopAt = endMs / 1000;
    const onTime = () => {
      if (a.currentTime >= stopAt) {
        a.pause();
        a.removeEventListener("timeupdate", onTime);
        setActiveIdx(null);
      }
    };
    a.addEventListener("timeupdate", onTime);
  };

  return (
    <div className="space-y-2">
      <div className="flex h-10 w-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
        {words.map((w, i) => {
          const width = ((w.endMs - w.startMs) / total) * 100;
          return (
            <button
              key={`${w.word}-${i}`}
              type="button"
              title={`${w.word} (${w.score})`}
              onClick={() => playSlice(w.startMs, w.endMs, i)}
              className={`relative h-full border-r border-zinc-900/60 transition ${
                activeIdx === i ? "ring-2 ring-inset ring-white/40" : "hover:brightness-125"
              }`}
              style={{ width: `${Math.max(width, 2)}%` }}
            >
              <span
                className={`absolute inset-x-0 bottom-0 ${scoreBar(w.score)}`}
                style={{ height: `${Math.max(18, w.score)}%` }}
              />
            </button>
          );
        })}
      </div>
      <p className="text-xs text-zinc-500">点击色块重播该词片段 · Click a segment to replay</p>
    </div>
  );
}
