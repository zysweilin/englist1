"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useTTS() {
  const [speaking, setSpeaking] = useState(false);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = useCallback(() => {
    if (typeof window === "undefined") return;
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string, opts?: { rate?: number; lang?: string }) => {
      if (typeof window === "undefined" || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = opts?.lang ?? "en-US";
      u.rate = opts?.rate ?? 0.92;
      u.onstart = () => setSpeaking(true);
      u.onend = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);
      utterRef.current = u;

      // Prefer a natural English voice when available
      const voices = window.speechSynthesis.getVoices();
      const en =
        voices.find((v) => /en-US/i.test(v.lang) && /Google|Natural|Samantha|Jenny/i.test(v.name)) ||
        voices.find((v) => /en-US/i.test(v.lang)) ||
        voices.find((v) => /^en/i.test(v.lang));
      if (en) u.voice = en;

      window.speechSynthesis.speak(u);
    },
    [],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Chrome loads voices async
    window.speechSynthesis?.getVoices();
    const handler = () => window.speechSynthesis.getVoices();
    window.speechSynthesis?.addEventListener?.("voiceschanged", handler);
    return () => {
      window.speechSynthesis?.removeEventListener?.("voiceschanged", handler);
      window.speechSynthesis?.cancel();
    };
  }, []);

  return { speak, stop, speaking };
}
