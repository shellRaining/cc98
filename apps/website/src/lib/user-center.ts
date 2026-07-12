import { POST_CONTENT_TYPE, type PostContentType } from "@cc98/api";
import { ubbToMarkdown } from "@cc98/ubb";
import { parsePageNumber } from "./route-params";

export type MePostKind = "recent" | "hot";
export type MeRelationKind = "following" | "followers";

function firstQueryValue(raw: unknown): string | undefined {
  if (Array.isArray(raw)) return typeof raw[0] === "string" ? raw[0] : undefined;
  return typeof raw === "string" ? raw : undefined;
}

export function parseUserCenterPage(raw: unknown): number {
  return parsePageNumber(firstQueryValue(raw));
}

export function normalizeMePostKind(raw: unknown): MePostKind {
  return firstQueryValue(raw) === "hot" ? "hot" : "recent";
}

export function normalizeFavoriteGroup(raw: unknown): number {
  const value = Number(firstQueryValue(raw) ?? 0);
  return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

export function normalizeFavoriteOrder(raw: unknown): 0 | 1 | 2 {
  const value = firstQueryValue(raw);
  if (value === "1") return 1;
  if (value === "2") return 2;
  return 0;
}

export function normalizeFavoriteKeyword(raw: unknown): string {
  return (firstQueryValue(raw) ?? "").trim();
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

export function pageCount(count: number | undefined, pageSize: number): number {
  return Math.max(1, Math.ceil(Math.max(0, count ?? 0) / Math.max(1, pageSize)));
}

export function orderByIds<T extends { id?: number }>(ids: number[], items: T[]): T[] {
  const byId = new Map(
    items.flatMap((item) => (item.id == null ? [] : [[item.id, item] as const])),
  );
  return ids.flatMap((id) => {
    const item = byId.get(id);
    return item ? [item] : [];
  });
}

export function postExcerpt(
  content: string | undefined,
  contentType: PostContentType | undefined,
  maxLength = 180,
): string {
  const source = content ?? "";
  const markdown = contentType === POST_CONTENT_TYPE.ubb ? ubbToMarkdown(source) : source;
  const text = markdown
    .replace(/!\[[^\]]*]\([^)]*\)/g, "[图片]")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/```[\s\S]*?```/g, "[代码]")
    .replace(/[`*_>#~]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "(无可预览内容)";
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}
