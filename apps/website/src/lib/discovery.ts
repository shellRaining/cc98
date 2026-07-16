/** 热门周期，对应 `/topic/hot-{period}`。 */
export type HotPeriod = "weekly" | "monthly" | "history";
export type NewTopicViewMode = "classic" | "card" | "media";

export const HOT_PERIOD_LABELS: Record<HotPeriod, string> = {
  weekly: "7日热门",
  monthly: "30日热门",
  history: "历史热门",
};

export function isHotPeriod(value: unknown): value is HotPeriod {
  return value === "weekly" || value === "monthly" || value === "history";
}

export function resolveNewTopicViewMode(value: unknown, preference = 0): NewTopicViewMode {
  if (value === "classic" || value === "card" || value === "media") return value;
  if (preference === 1) return "card";
  if (preference === 2) return "media";
  return "classic";
}

export function newTopicViewPreference(mode: NewTopicViewMode) {
  if (mode === "card") return 1;
  if (mode === "media") return 2;
  return 0;
}

export function newTopicsPath(mode: NewTopicViewMode) {
  return mode === "classic" ? "/newtopics" : `/newtopics?view=${mode}`;
}

export function uniqueTopicBoardIds(topics: Array<{ boardId?: number }>) {
  return [...new Set(topics.flatMap((topic) => (topic.boardId ? [topic.boardId] : [])))];
}

export function uniqueTopicUserIds(
  topics: Array<{ userId?: number | null; isAnonymous?: boolean }>,
) {
  return [
    ...new Set(
      topics.flatMap((topic) =>
        !topic.isAnonymous && topic.userId != null && topic.userId > 0 ? [topic.userId] : [],
      ),
    ),
  ];
}

export function formatDiscoveryTime(value: string | undefined, now = new Date()) {
  if (!value) return "—";
  const time = new Date(value);
  if (Number.isNaN(time.getTime())) return value;
  const diff = now.getTime() - time.getTime();
  const minutes = Math.max(0, Math.floor(diff / 60_000));
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(diff / 3_600_000);
  const clock = time.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  if (hours < 24 && time.getDate() === now.getDate()) return `今天 ${clock}`;
  const dayDiff = Math.floor(
    (new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
      new Date(time.getFullYear(), time.getMonth(), time.getDate()).getTime()) /
      86_400_000,
  );
  if (dayDiff === 1) return `昨天 ${clock}`;
  if (dayDiff === 2) return `前天 ${clock}`;
  return `${time.getFullYear()}-${String(time.getMonth() + 1).padStart(2, "0")}-${String(time.getDate()).padStart(2, "0")} ${clock}`;
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
