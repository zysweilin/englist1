"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { listDialogues, listShadowing } from "@/lib/curriculum";
import type { Level, Mode } from "@/lib/types";

function PracticeRedirect() {
  const router = useRouter();
  const params = useSearchParams();
  const level = (params.get("level") as Level) || "L1";
  const mode = (params.get("mode") as Mode) || "shadowing";

  const items =
    mode === "shadowing" ? listShadowing(level) : listDialogues(level);
  const first = items[0];

  useEffect(() => {
    if (!first) return;
    const path =
      mode === "shadowing"
        ? `/shadowing/${first.id}`
        : `/dialogue/${first.id}`;
    router.replace(path);
  }, [first, mode, router]);

  if (!first) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-14">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-800">
          ← 返回
        </Link>
        <p className="mt-6 text-zinc-600">该级别暂无课程内容，请返回首页重选。</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 text-zinc-500">
      正在进入练习…
    </div>
  );
}

export default function PracticePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-14 text-zinc-500">加载中…</div>
      }
    >
      <PracticeRedirect />
    </Suspense>
  );
}
