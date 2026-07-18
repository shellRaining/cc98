import type { HotPeriod } from "../api/discovery";

/** 去掉首尾空白；空串视为无关键词。 */
export function normalizeSearchKeyword(raw: string | undefined | null): string {
  return (raw ?? "").trim();
}

/** 版面筛选：缺省、0、非法都当作全站搜索。 */
export function normalizeSearchBoardId(raw: string | number | undefined | null): number | null {
  if (raw == null || raw === "") return null;
  const value = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isSafeInteger(value) || value <= 0) return null;
  return value;
}

export function hotTopicsPath(period: HotPeriod): string {
  return `/topic/hot-${period}`;
}

export function searchTopicsPath(keyword: string, boardId?: number | null): string {
  const normalized = normalizeSearchKeyword(keyword);
  if (!normalized) return "/search";

  const params = new URLSearchParams();
  const board = normalizeSearchBoardId(boardId);
  params.set("boardId", String(board ?? 0));
  params.set("keyword", normalized);
  return `/search?${params.toString()}`;
}

export function searchBoardsPath(keyword: string): string {
  const normalized = normalizeSearchKeyword(keyword);
  return normalized ? `/searchBoard?keyword=${encodeURIComponent(normalized)}` : "/searchBoard";
}

export function userIdPath(userId: number | string): string {
  return `/user/id/${userId}`;
}

export function userNamePath(userName: string): string {
  return `/user/name/${encodeURIComponent(userName)}`;
}
