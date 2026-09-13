export function scoreColor(score: number): string {
  if (score >= 85) return "text-emerald-400";
  if (score >= 70) return "text-lime-400";
  if (score >= 55) return "text-amber-400";
  return "text-rose-400";
}

export function scoreBg(score: number): string {
  if (score >= 85) return "bg-emerald-500/20 border-emerald-500/40";
  if (score >= 70) return "bg-lime-500/15 border-lime-500/30";
  if (score >= 55) return "bg-amber-500/15 border-amber-500/30";
  return "bg-rose-500/15 border-rose-500/30";
}

export function scoreBar(score: number): string {
  if (score >= 85) return "bg-emerald-400";
  if (score >= 70) return "bg-lime-400";
  if (score >= 55) return "bg-amber-400";
  return "bg-rose-400";
}

export function scoreLabel(score: number): string {
  if (score >= 85) return "优秀";
  if (score >= 70) return "良好";
  if (score >= 55) return "尚可";
  return "需改进";
}
