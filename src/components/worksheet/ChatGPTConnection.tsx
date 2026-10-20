"use client";

import { useEffect, useState } from "react";

type Connection = {
  status: string; sharing: boolean; identity?: { email?: string; name?: string }; model?: string; error?: string;
};

export function ChatGPTConnection() {
  const [connection, setConnection] = useState<Connection>({ status: "disconnected", sharing: false });
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    async function refresh() {
      try {
        const response = await fetch("/api/coach/chatgpt", { cache: "no-store", signal: controller.signal });
        const next = await response.json();
        if (alive && response.ok) {
          setConnection(next);
          setUrl(next.status === "connecting" ? next.loginUrl || "" : "");
        }
      } catch { /* Keep the current display while the local server reconnects. */ }
    }
    void refresh();
    const timer = setInterval(() => void refresh(), 3000);
    return () => { alive = false; controller.abort(); clearInterval(timer); };
  }, []);

  async function connect() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/coach/chatgpt", { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "无法开始登录，请重试。");
      setUrl(result.url);
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch (failure) { setError(failure instanceof Error ? failure.message : "登录失败。"); }
    finally { setBusy(false); }
  }
  async function disconnect() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/coach/chatgpt", { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "断开连接失败。");
      setConnection(result); setUrl("");
    } catch (failure) { setError(failure instanceof Error ? failure.message : "断开失败。"); }
    finally { setBusy(false); }
  }
  const connected = connection.status === "connected" && connection.sharing;
  return <div className="chatgpt-connection">
    <div className="chatgpt-connection-row">
      <div><strong>{connected ? "使用 ChatGPT 套餐" : "连接你的 ChatGPT 套餐"}</strong>
        <p>{connected ? `${connection.identity?.email || connection.identity?.name || "已连接"}${connection.model ? ` · ${connection.model}` : ""}` : "登录并授权后，即可生成音标、发音细节和中文翻译。"}</p>
      </div>
      {connected ? <button className="text-button" disabled={busy} onClick={() => void disconnect()}>断开连接</button>
        : <button className="chatgpt-signin" disabled={busy || connection.status === "connecting"} onClick={() => void connect()}>
          {busy || connection.status === "connecting" ? "等待官方登录授权…" : "Continue with ChatGPT"}
        </button>}
    </div>
    {url && <p><a href={url} target="_blank" rel="noopener noreferrer">打开官方登录页面</a> · 完成后回到这里
      <button className="text-button" onClick={() => void disconnect()} disabled={busy}>取消</button></p>}
    {(error || connection.error) && <p role="alert">{error || connection.error}</p>}
    <p>本机验证 · 范读使用设备语音 · <a href="https://chatgpt.com/settings/usage" target="_blank" rel="noopener noreferrer">管理 ChatGPT 用量</a></p>
  </div>;
}
