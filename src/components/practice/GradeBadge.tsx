"use client";

import { gradeLabel } from "@/lib/scoreColor";

type Props = {
  score: number;
  /** Force a specific grade for style samples. */
  force?: "perfect" | "good";
  className?: string;
};

export function GradeBadge({ score, force, className = "" }: Props) {
  const grade = force ?? gradeLabel(score);
  if (!grade) return null;

  if (grade === "perfect") {
    return (
      <span
        className={`inline-block font-[family-name:var(--font-instrument-serif)] text-4xl italic tracking-wide text-emerald-600 md:text-5xl ${className}`}
        style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}
      >
        Perfect
      </span>
    );
  }

  return (
    <span
      className={`inline-block text-3xl font-bold tracking-tight text-lime-600 md:text-4xl ${className}`}
    >
      Good
    </span>
  );
}
