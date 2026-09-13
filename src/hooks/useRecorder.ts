"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type RecorderState = "idle" | "recording" | "ready" | "error";

export function useRecorder() {
  const [state, setState] = useState<RecorderState>("idle");
  const [level, setLevel] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const startedAtRef = useRef<number>(0);
  const tickRef = useRef<number | null>(null);

  const cleanupMeter = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (tickRef.current != null) window.clearInterval(tickRef.current);
    tickRef.current = null;
    setLevel(0);
  }, []);

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    void audioCtxRef.current?.close();
    audioCtxRef.current = null;
    analyserRef.current = null;
  }, []);

  const revokeUrl = useCallback(() => {
    if (url) URL.revokeObjectURL(url);
  }, [url]);

  const startMeter = useCallback((stream: MediaStream) => {
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyserRef.current = analyser;
    const data = new Uint8Array(analyser.frequencyBinCount);

    const loop = () => {
      analyser.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i];
      const avg = sum / data.length / 255;
      setLevel(Math.min(1, avg * 1.8));
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setBlob(null);
    revokeUrl();
    setUrl(null);
    setElapsedMs(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mime =
        MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : MediaRecorder.isTypeSupported("audio/webm")
            ? "audio/webm"
            : "";

      const recorder = mime
        ? new MediaRecorder(stream, { mimeType: mime })
        : new MediaRecorder(stream);
      mediaRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        cleanupMeter();
        const b = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        setBlob(b);
        setUrl(URL.createObjectURL(b));
        setState("ready");
        releaseStream();
      };

      recorder.start(100);
      startedAtRef.current = Date.now();
      tickRef.current = window.setInterval(() => {
        setElapsedMs(Date.now() - startedAtRef.current);
      }, 100);
      startMeter(stream);
      setState("recording");
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "无法访问麦克风 / Microphone unavailable";
      setError(msg);
      setState("error");
      releaseStream();
      cleanupMeter();
    }
  }, [cleanupMeter, releaseStream, revokeUrl, startMeter]);

  const stop = useCallback(() => {
    const rec = mediaRef.current;
    if (rec && rec.state !== "inactive") {
      rec.stop();
    } else {
      cleanupMeter();
      releaseStream();
      setState("idle");
    }
  }, [cleanupMeter, releaseStream]);

  const reset = useCallback(() => {
    stop();
    revokeUrl();
    setBlob(null);
    setUrl(null);
    setState("idle");
    setError(null);
    setElapsedMs(0);
  }, [revokeUrl, stop]);

  useEffect(() => {
    return () => {
      cleanupMeter();
      releaseStream();
      if (url) URL.revokeObjectURL(url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    state,
    level,
    blob,
    url,
    error,
    elapsedMs,
    start,
    stop,
    reset,
  };
}
