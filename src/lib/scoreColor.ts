export function scoreColor(score: number): string {
  if (score >= 85) return "text-emerald-600";
  if (score >= 70) return "text-lime-600";
  if (score >= 55) return "text-amber-600";
  return "text-rose-600";
}

export function scoreBg(score: number): string {
  if (score >= 85) return "bg-emerald-500/15 border-emerald-500/35";
  if (score >= 70) return "bg-lime-500/12 border-lime-500/30";
  if (score >= 55) return "bg-amber-500/12 border-amber-500/30";
  return "bg-rose-500/12 border-rose-500/30";
}

export function scoreBar(score: number): string {
  if (score >= 85) return "bg-emerald-500";
  if (score >= 70) return "bg-lime-500";
  if (score >= 55) return "bg-amber-500";
  return "bg-rose-500";
}

export function scoreLabel(score: number): string {
  if (score >= 85) return "优秀";
  if (score >= 70) return "良好";
  if (score >= 55) return "尚可";
  return "需改进";
}

/** Qualitative grade for UI badges — no numeric display. */
export function gradeLabel(score: number): "perfect" | "good" | null {
  if (score >= 90) return "perfect";
  if (score >= 75) return "good";
  return null;
}
