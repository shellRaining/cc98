import type { AnnualReviewV2 } from "@cc98/api";

export type AnnualReviewPage =
  | "cover"
  | "overview"
  | "likes"
  | "topics"
  | "ratings"
  | "boards"
  | "time"
  | "card-draw"
  | "bet"
  | "achievements";

export function annualReviewPages(data: AnnualReviewV2): AnnualReviewPage[] {
  return [
    "cover",
    "overview",
    "likes",
    "topics",
    "ratings",
    "boards",
    "time",
    ...(data.cardDraw ? (["card-draw"] as const) : []),
    ...(data.bet ? (["bet"] as const) : []),
    "achievements",
  ];
}

export function resolveFavoritePostPeriod(data: AnnualReviewV2): string | null {
  const periods = [
    { name: "深夜", count: data.postCount06 ?? 0 },
    { name: "上午", count: data.postCount612 ?? 0 },
    { name: "下午", count: data.postCount1218 ?? 0 },
    { name: "晚上", count: data.postCount1824 ?? 0 },
  ];
  const max = Math.max(...periods.map((item) => item.count));
  if (max <= 0) return null;
  const winners = periods.filter((item) => item.count === max);
  return winners.length === 1 ? (winners[0]?.name ?? null) : null;
}

export function annualReviewWinRate(data: AnnualReviewV2): string {
  const total = data.bet?.totalCount ?? 0;
  const wins = data.bet?.winCount ?? 0;
  return total > 0 ? `${((wins / total) * 100).toFixed(1)}%` : "0.0%";
}

export function annualReviewAchievements(value?: string): string[] {
  return (value ?? "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}
