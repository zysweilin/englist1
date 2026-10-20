import type { Metadata } from "next";
import "./globals.css";
import "./ipa-font.css";

export const metadata: Metadata = {
  title: "Englist · 让英语自然地连起来",
  description: "一张简单的美式发音作业纸。输入英文或语音，看连读、弱读和语调，听范读，再录下自己的发音。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="zh-CN"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-white text-zinc-800 font-sans">
        {children}
      </body>
    </html>
  );
}
