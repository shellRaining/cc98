import { boardGroupSchema, type Board, type BoardGroup } from "@cc98/api";
import snapshot from "./board-directory.json";

export const bundledBoardGroups = boardGroupSchema.array().parse(snapshot);

export function boardsById(groups: BoardGroup[]): Map<number, Board> {
  return new Map(
    groups.flatMap((group) =>
      (group.boards ?? []).flatMap((board) =>
        board.id == null ? [] : ([[board.id, board]] as const),
      ),
    ),
  );
}

export function selectBoards(groups: BoardGroup[], ids: number[]): Board[] {
  const directory = boardsById(groups);
  return ids.flatMap((id) => {
    const board = directory.get(id);
    return board ? [board] : [];
  });
}
