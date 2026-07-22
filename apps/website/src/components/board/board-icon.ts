import cc98IconUrl from "../../assets/brand/cc98.png";

const iconModules = import.meta.glob("../../assets/board-icons/*.png", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const boardIconByName = new Map(
  Object.entries(iconModules).flatMap(([path, url]) => {
    const name = path.match(/\/([^/]+)\.png$/)?.[1];
    return name ? [[name, url] as const] : [];
  }),
);

export const BOARD_ICON_FALLBACK = cc98IconUrl;

export function boardIconUrl(boardName: string | undefined): string {
  return (boardName && boardIconByName.get(boardName)) || BOARD_ICON_FALLBACK;
}
