"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useLessonAudio(aiEnabled: boolean) {
  const [state, setState] = useState<"idle" | "loading" | "playing">("idle");
  const [notice, setNotice] = useState("");
  const [wordPosition, setWordPosition] = useState<number | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  const request = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const watchdog = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cache = useRef(new Map<string, string>());
  const stop = useCallback(() => {
    generation.current++;
    if (watchdog.current) clearTimeout(watchdog.current);
    request.current?.abort();
    if (audio.current) { audio.current.pause(); audio.current.src = ""; audio.current = null; }
    window.speechSynthesis?.cancel();
    setState("idle");
    setWordPosition(null);
  }, []);

  const play = useCallback(async (text: string, rate: number, browserOnly = false) => {
    stop();
    const current = generation.current;
    setNotice("");
    setState("loading");
    const player = new Audio();
    audio.current = player;
    if (aiEnabled && !browserOnly) {
      try {
        let url = cache.current.get(text);
        if (!url) {
          const controller = new AbortController();
          request.current = controller;
          const response = await fetch("/api/coach/speech", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }), signal: controller.signal,
          });
          if (!response.ok) throw new Error("范读服务暂时不可用");
          const blob = await response.blob();
          if (current !== generation.current) return;
          url = URL.createObjectURL(blob);
          if (cache.current.size >= 8) {
            const first = cache.current.keys().next().value!;
            URL.revokeObjectURL(cache.current.get(first)!);
            cache.current.delete(first);
          }
          cache.current.set(text, url);
        }
        if (current !== generation.current) return;
        player.src = url;
        player.playbackRate = rate;
        player.onended = () => { if (current === generation.current) setState("idle"); };
        player.onerror = () => {
          if (current === generation.current) { setState("idle"); setNotice("音频播放失败，请重新播放。"); }
        };
        await player.play();
        if (current === generation.current) { setState("playing"); setNotice("AI 合成范读 · 标记是建议读法，实际细节可能略有不同"); }
        return;
      } catch {
        if (current !== generation.current) return;
        setNotice("AI 范读暂不可用，已尝试切换到设备美式朗读。");
      }
    }
    if (!window.speechSynthesis) { setState("idle"); setNotice("这个浏览器不支持设备朗读，请换用 Chrome 或 Edge。"); return; }
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((v) => /^en[-_]US$/i.test(v.lang) && /Natural|Google|Jenny|Aria|Samantha/i.test(v.name))
      ?? voices.find((v) => /^en[-_]US$/i.test(v.lang));
    const speech = new SpeechSynthesisUtterance(text);
    utterance.current = speech;
    speech.lang = "en-US";
    speech.rate = rate;
    if (voice) speech.voice = voice;
    speech.onstart = () => {
      if (watchdog.current) clearTimeout(watchdog.current);
      if (current === generation.current) setState("playing");
    };
    speech.onboundary = (event) => {
      if (current === generation.current && event.name === "word") setWordPosition(event.charIndex);
    };
    speech.onend = () => {
      if (watchdog.current) clearTimeout(watchdog.current);
      if (current === generation.current) { setState("idle"); setWordPosition(null); }
    };
    speech.onerror = () => {
      if (watchdog.current) clearTimeout(watchdog.current);
      if (current === generation.current) { setState("idle"); setWordPosition(null); setNotice("设备朗读失败，请检查系统英文语音，或再次点击播放。"); }
    };
    if (!aiEnabled || browserOnly) setNotice(voice ? "设备合成朗读 · 美式英语，细节以所选语音为准" : "设备合成朗读 · 未检测到美式语音，系统将尝试使用 en-US");
    // Some embedded browsers expose speechSynthesis but never start or report an error.
    watchdog.current = setTimeout(() => {
      if (current !== generation.current) return;
      generation.current++;
      window.speechSynthesis.cancel();
      setState("idle"); setWordPosition(null);
      setNotice("设备未能启动英文朗读。请使用有英文语音的 Chrome / Edge，或配置 AI 范读。");
    }, 8000);
    window.speechSynthesis.speak(speech);
  }, [aiEnabled, stop]);

  useEffect(() => {
    window.speechSynthesis?.getVoices();
    const urls = cache.current;
    return () => {
      generation.current++;
      if (watchdog.current) clearTimeout(watchdog.current);
      request.current?.abort();
      audio.current?.pause();
      window.speechSynthesis?.cancel();
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);
  return { state, play, stop, notice, wordPosition };
}
