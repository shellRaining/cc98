import type { FocusMode } from "../../api/discovery";

export function resolveFocusMode(value: unknown): FocusMode {
  if (value === "user" || value === "favorite") return value;
  return "board";
}

export function resolveFocusBoardId(value: unknown) {
  const raw = Array.isArray(value) ? value[0] : value;
  const boardId = Number(raw);
  return Number.isInteger(boardId) && boardId > 0 ? boardId : 0;
}

export function focusPath(mode: FocusMode, boardId = 0) {
  if (mode === "user") return "/focus/user";
  if (mode === "favorite") return "/focus/favorite";
  return boardId > 0 ? `/focus/board?boardId=${boardId}` : "/focus/board";
}
