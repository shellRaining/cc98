import { userCenterQueryValue } from "./navigation";

export type MePostKind = "recent" | "hot";

export function normalizeMePostKind(raw: unknown): MePostKind {
  return userCenterQueryValue(raw) === "hot" ? "hot" : "recent";
}
