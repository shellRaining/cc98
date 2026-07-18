export const BOARD_ICON_FALLBACK = "/static/images/_CC98.png";

export function boardIconUrl(boardName: string | undefined): string {
  return `/static/images/_${boardName || "CC98"}.png`;
}
