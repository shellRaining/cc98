/** 热门周期，对应 `/topic/hot-{period}`。 */
export type HotPeriod = "weekly" | "monthly" | "history";

export const HOT_PERIOD_LABELS: Record<HotPeriod, string> = {
  weekly: "7日热门",
  monthly: "30日热门",
  history: "历史热门",
};

export function isHotPeriod(value: unknown): value is HotPeriod {
  return value === "weekly" || value === "monthly" || value === "history";
}

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

export function searchTopicsPath(keyword: string, boardId?: number | null, page = 1): string {
  const params = new URLSearchParams();
  const normalized = normalizeSearchKeyword(keyword);
  if (normalized) params.set("keyword", normalized);
  const board = normalizeSearchBoardId(boardId);
  if (board != null) params.set("boardId", String(board));
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/search?${query}` : "/search";
}

export function searchBoardsPath(keyword: string): string {
  const normalized = normalizeSearchKeyword(keyword);
  return normalized ? `/search/boards?keyword=${encodeURIComponent(normalized)}` : "/search/boards";
}

export function userIdPath(userId: number | string): string {
  return `/user/id/${userId}`;
}

export function userNamePath(userName: string): string {
  return `/user/name/${encodeURIComponent(userName)}`;
}

/** 按主题 ID 去重，保留首次出现顺序。 */
export function dedupeTopicsById<T extends { id?: number }>(topics: T[]): T[] {
  const seen = new Set<number>();
  const result: T[] = [];
  for (const topic of topics) {
    if (topic.id == null) {
      result.push(topic);
      continue;
    }
    if (seen.has(topic.id)) continue;
    seen.add(topic.id);
    result.push(topic);
  }
  return result;
}
