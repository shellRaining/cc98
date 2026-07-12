/** 解析路由中的正整数 ID；非法时返回 null。 */
export function parsePositiveInt(raw: string | undefined | null): number | null {
  if (raw == null || !/^\d+$/.test(raw)) return null;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value <= 0) return null;
  return value;
}

/** 解析页码，缺省或非法时回落到 1。 */
export function parsePageNumber(raw: string | undefined | null, fallback = 1): number {
  const value = parsePositiveInt(raw);
  return value ?? fallback;
}

/**
 * 版面路由 `/list/:boardId/:type?/:page?` 在只有一段可选参数时，
 * Vue Router 会把它填进 type。阶段 3 不做 type 筛选，因此单独数字段按页码解释。
 */
export function resolveBoardPage(type?: string, page?: string): number {
  if (page != null && page !== "") return parsePageNumber(page);
  if (type != null && /^\d+$/.test(type)) return parsePageNumber(type);
  return 1;
}

/** 生成版面页路径，避免可选参数把页码写进 type 槽位。 */
export function boardPagePath(boardId: string | number, page: number): string {
  const id = String(boardId);
  return page > 1 ? `/list/${id}/${page}` : `/list/${id}`;
}

/** 页码（从 1 开始）转接口 from（从 0 开始）。 */
export function pageToFrom(page: number, pageSize: number): number {
  const safePage = Math.max(1, page);
  const safeSize = Math.max(1, pageSize);
  return (safePage - 1) * safeSize;
}

/** 楼层（从 1 开始）转页码（从 1 开始）。 */
export function floorToPage(floor: number, pageSize = 10): number {
  const safeFloor = Math.max(1, Math.floor(floor));
  const safeSize = Math.max(1, Math.floor(pageSize));
  return Math.floor((safeFloor - 1) / safeSize) + 1;
}

/** 主题总页数：楼主计入第一页，replyCount 为回复数。 */
export function topicTotalPages(replyCount: number | undefined | null, pageSize = 10): number {
  const floors = Math.max(0, replyCount ?? 0) + 1;
  return Math.max(1, Math.ceil(floors / Math.max(1, pageSize)));
}

/** 版面总页数：优先用 topicCount；未知时返回 null。 */
export function boardTotalPages(
  topicCount: number | undefined | null,
  pageSize = 20,
): number | null {
  if (topicCount == null || !Number.isFinite(topicCount) || topicCount < 0) return null;
  if (topicCount === 0) return 1;
  return Math.max(1, Math.ceil(topicCount / Math.max(1, pageSize)));
}

/** 把页码夹到 [1, totalPages]；totalPages 未知时只保证 >= 1。 */
export function clampPage(page: number, totalPages: number | null | undefined): number {
  const safePage = Math.max(1, page);
  if (totalPages == null || totalPages < 1) return safePage;
  return Math.min(safePage, totalPages);
}

/** 生成分页窗口：首页、末页、当前附近页，省略处用 null。 */
export function paginationWindow(current: number, total: number, radius = 2): Array<number | null> {
  if (total <= 0) return [];
  const safeCurrent = clampPage(current, total);
  if (total <= radius * 2 + 3) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, total]);
  for (let p = safeCurrent - radius; p <= safeCurrent + radius; p += 1) {
    if (p >= 1 && p <= total) pages.add(p);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const result: Array<number | null> = [];
  for (let i = 0; i < sorted.length; i += 1) {
    const page = sorted[i]!;
    if (i > 0 && page - sorted[i - 1]! > 1) result.push(null);
    result.push(page);
  }
  return result;
}

/** 旧站楼层 hash 使用纯数字；第 10 楼曾用 id="0"。 */
export function normalizeFloorHash(hash: string): string | null {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!raw) return null;
  if (raw.startsWith("floor-")) return raw;
  if (/^\d+$/.test(raw)) {
    const floor = Number.parseInt(raw, 10);
    if (floor <= 0) return null;
    return `floor-${floor}`;
  }
  return null;
}

export function floorAnchorId(floor: number): string {
  return `floor-${floor}`;
}
