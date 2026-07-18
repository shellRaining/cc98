import { userCenterQueryValue } from "./navigation";

export function normalizeFavoriteGroup(raw: unknown): number {
  const value = Number(userCenterQueryValue(raw) ?? 0);
  return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

export function normalizeFavoriteOrder(raw: unknown): 0 | 1 | 2 {
  const value = userCenterQueryValue(raw);
  if (value === "1") return 1;
  if (value === "2") return 2;
  return 0;
}

export function normalizeFavoriteKeyword(raw: unknown): string {
  return (userCenterQueryValue(raw) ?? "").trim();
}
