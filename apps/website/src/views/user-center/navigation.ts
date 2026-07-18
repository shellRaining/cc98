import { parsePageNumber } from "../../lib/route-params";

export function userCenterQueryValue(raw: unknown): string | undefined {
  if (Array.isArray(raw)) return typeof raw[0] === "string" ? raw[0] : undefined;
  return typeof raw === "string" ? raw : undefined;
}

export function parseUserCenterPage(raw: unknown): number {
  return parsePageNumber(userCenterQueryValue(raw));
}

export function userCenterPagePath(
  path: string,
  page: number,
  query: Record<string, string | number | undefined> = {},
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  if (page > 1) params.set("page", String(page));
  const serialized = params.toString();
  return serialized ? `${path}?${serialized}` : path;
}
