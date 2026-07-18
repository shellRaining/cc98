import type { HotPeriod } from "../../api/discovery";

export const HOT_PERIOD_LABELS: Record<HotPeriod, string> = {
  weekly: "7日热门话题",
  monthly: "30日热门话题",
  history: "历史上的今天",
};

export function isHotPeriod(value: unknown): value is HotPeriod {
  return value === "weekly" || value === "monthly" || value === "history";
}
