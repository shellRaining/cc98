import type { Board, BoardGroup } from "@cc98/api";
import type {
  TopicModerationAction,
  TopicModerationRequest,
} from "../../../api/mutations/moderation";

export const MODERATION_DAY_OPTIONS = [7, 14, 30, 98, 180, 365, 1000, 10000] as const;

export function flattenModerationBoards(groups: readonly BoardGroup[] | undefined): Board[] {
  return (groups ?? []).flatMap((group) => group.boards ?? []).filter((board) => board.id != null);
}

export function topicModerationNeedsDays(action: TopicModerationAction): boolean {
  return ["lock", "set-board-top", "set-global-top", "highlight"].includes(action);
}

export function topicModerationNeedsTargetBoard(action: TopicModerationAction): boolean {
  return action === "move";
}

export function validateTopicModerationRequest(request: TopicModerationRequest): string | null {
  if (!request.reason.trim()) return "请输入操作理由";
  if (
    topicModerationNeedsDays(request.action) &&
    (!Number.isInteger(request.days) || (request.days ?? 0) <= 0)
  ) {
    return "请选择有效天数";
  }
  if (topicModerationNeedsTargetBoard(request.action) && !request.targetBoardId) {
    return "请选择目标版面";
  }
  if (request.action === "highlight" && !/^#[0-9a-f]{6}$/i.test(request.color ?? "")) {
    return "请选择合法的高亮颜色";
  }
  return null;
}
