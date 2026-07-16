const COMPACT_BOARD_GROUP_IDS = new Set([2, 29, 33, 35, 37, 604]);

export function isCompactBoardGroup(groupId: number | undefined): boolean {
  return groupId != null && COMPACT_BOARD_GROUP_IDS.has(groupId);
}

export function boardGroupAnchor(groupId: number | undefined): string {
  return `board-group-${groupId ?? "unknown"}`;
}

export function boardIconUrl(boardName: string | undefined): string {
  return `/static/images/_${boardName || "CC98"}.png`;
}

export const BOARD_ICON_FALLBACK = "/static/images/_CC98.png";
