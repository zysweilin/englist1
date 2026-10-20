import type { CSSProperties } from "react";

export function Icon({ name, size = 20, style }: { name: "play" | "stop" | "mic" | "arrow" | "book" | "chevron" | "close" | "download"; size?: number; style?: CSSProperties }) {
  const paths = {
    play: <path d="m9 5 11 7-11 7V5Z" />,
    stop: <rect x="6" y="6" width="12" height="12" rx="1" />,
    mic: <><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8" /></>,
    arrow: <><path d="M5 12h14m-6-6 6 6-6 6" /></>,
    book: <><path d="M4 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-3H4V4Zm9 3a3 3 0 0 1 3-3h5v14h-4a4 4 0 0 0-4 3" /></>,
    chevron: <path d="m9 5 7 7-7 7" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    download: <path d="M12 3v12m-4-4 4 4 4-4M5 16v5h14v-5" />,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={["play", "stop"].includes(name) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style}>{paths[name]}</svg>;
}
