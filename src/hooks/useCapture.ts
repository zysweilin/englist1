"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_RECORDING_MS } from "@/lib/coach/contracts";

export type Capture = { blob: Blob; durationMs: number; createdAt: string };
export function useCapture(onComplete: (capture: Capture) => void) {
  const [state, setState] = useState<"idle" | "requesting" | "recording">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const callback = useRef(onComplete);
  useEffect(() => { callback.current = onComplete; }, [onComplete]);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const generation = useRef(0);
  const pending = useRef(false);
  const cleanup = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    pending.current = false;
  }, []);
  const stop = useCallback(() => {
    if (recorder.current?.state === "recording") recorder.current.stop();
  }, []);
  const cancel = useCallback(() => {
    generation.current++;
    if (recorder.current?.state === "recording") recorder.current.stop();
    recorder.current = null;
    cleanup();
    setState("idle");
    setElapsed(0);
  }, [cleanup]);
  const start = useCallback(async () => {
    if (pending.current || recorder.current?.state === "recording") return;
    pending.current = true;
    const current = ++generation.current;
    setError("");
    setState("requesting");
    setElapsed(0);
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
        throw new Error("录音需要 HTTPS 或 localhost，并使用支持录音的浏览器。");
      }
      const media = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      if (current !== generation.current) { media.getTracks().forEach((track) => track.stop()); return; }
      stream.current = media;
      const mimeType = ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg;codecs=opus"]
        .find((type) => MediaRecorder.isTypeSupported(type));
      const rec = new MediaRecorder(media, mimeType ? { mimeType } : undefined);
      recorder.current = rec;
      const chunks: Blob[] = [];
      const startedAt = Date.now();
      rec.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      rec.onerror = () => {
        if (current !== generation.current) return;
        generation.current++;
        cleanup(); setState("idle"); setError("录音中断，请检查麦克风后重试。");
      };
      rec.onstop = () => {
        if (current !== generation.current) return;
        const durationMs = Date.now() - startedAt;
        cleanup(); setState("idle");
        const blob = new Blob(chunks, { type: rec.mimeType || mimeType || "audio/webm" });
        if (blob.size === 0 || durationMs < 300) { setError("录音太短了，再说一遍试试。"); return; }
        callback.current({ blob, durationMs, createdAt: new Date().toISOString() });
      };
      rec.start(250);
      setState("recording");
      timer.current = setInterval(() => {
        const ms = Date.now() - startedAt;
        setElapsed(ms);
        if (ms >= MAX_RECORDING_MS) stop();
      }, 100);
    } catch (failure) {
      if (current !== generation.current) return;
      cleanup(); setState("idle");
      const name = failure instanceof Error ? failure.name : "";
      setError(name === "NotAllowedError" ? "麦克风权限未开启。请在地址栏允许麦克风，再点一次。"
        : name === "NotFoundError" ? "没有找到麦克风，请连接设备后重试。"
          : failure instanceof Error ? failure.message : "无法开始录音，请重试。");
    }
  }, [cleanup, stop]);
  useEffect(() => () => {
    generation.current++;
    if (recorder.current?.state === "recording") recorder.current.stop();
    cleanup();
  }, [cleanup]);
  return { state, elapsed, error, start, stop, cancel };
}
