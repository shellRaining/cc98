import { parsePageNumber, parsePositiveInt } from "./route-params.ts";

export type BoardViewMode = "all" | "best" | "save" | "tag" | "record";

export function resolveBoardViewMode(type: string | undefined): BoardViewMode {
  if (type === "best" || type === "save" || type === "tag" || type === "record") return type;
  return "all";
}

export function resolveBoardViewPage(type: string | undefined, page: string | undefined): number {
  if (resolveBoardViewMode(type) === "all") return parsePageNumber(type ?? page);
  return parsePageNumber(page);
}

export function resolveBoardTag(value: unknown): number | undefined {
  const parsed = parsePositiveInt(typeof value === "string" ? value : null);
  return parsed ?? undefined;
}

export function boardViewPath(
  boardId: string | number,
  mode: BoardViewMode,
  page = 1,
  tags: { tag1?: number; tag2?: number } = {},
) {
  const id = String(boardId);
  const segment = mode === "all" ? "" : `/${mode}`;
  const pageSegment = page > 1 ? `/${page}` : "";
  const query = new URLSearchParams();
  if (mode === "tag" && tags.tag1) query.set("tag1", String(tags.tag1));
  if (mode === "tag" && tags.tag2) query.set("tag2", String(tags.tag2));
  const suffix = query.size ? `?${query.toString()}` : "";
  return `/list/${id}${segment}${pageSegment}${suffix}`;
}
