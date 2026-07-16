import type { Board, BoardGroup, Topic } from "@cc98/api";
import type { AuthUser } from "../stores/user";

export const MODERATION_DAY_OPTIONS = [7, 14, 30, 98, 180, 365, 1000, 10000] as const;

export type TopicModerationAction =
  | "lock"
  | "unlock"
  | "disable-hot"
  | "enable-hot"
  | "delete"
  | "move"
  | "bump"
  | "set-board-top"
  | "set-global-top"
  | "remove-top"
  | "set-best"
  | "remove-best"
  | "highlight";

export type PostModerationAction =
  | "reward-wealth"
  | "reward-prestige"
  | "deduct-wealth"
  | "deduct-prestige"
  | "delete"
  | "mute"
  | "unmute";

export interface PostModerationRequest {
  action: PostModerationAction;
  postId: number;
  boardId: number;
  userId?: number | null;
  reason: string;
  value?: number;
  days?: number;
}

export type BatchTopicModerationAction = "lock" | "delete";

export interface BatchTopicModerationRequest {
  action: BatchTopicModerationAction;
  topicIds: number[];
  reason: string;
  days?: number;
}

export interface TopicModerationRequest {
  action: TopicModerationAction;
  topicId: number;
  reason: string;
  days?: number;
  targetBoardId?: number;
  isBold?: boolean;
  isItalic?: boolean;
  color?: string;
}

export interface TopicModerationAccess {
  canManage: boolean;
  canViewHistory: boolean;
  canViewIp: boolean;
}

export function isBoardManager(
  user: AuthUser | null | undefined,
  board: Board | null | undefined,
): boolean {
  if (!user || !board) return false;
  if (user.privilege === "管理员" || user.privilege === "超级版主") return true;
  return (board.boardMasters ?? []).includes(user.name);
}

export function hasTopicAuthorManagement(
  user: AuthUser | null | undefined,
  topic: Topic | null | undefined,
): boolean {
  return Boolean(
    user && topic && topic.userId === user.id && (topic.topicAuthorPermissions?.length ?? 0) > 0,
  );
}

export function resolveTopicModerationAccess(
  user: AuthUser | null | undefined,
  board: Board | null | undefined,
  topic: Topic | null | undefined,
): TopicModerationAccess {
  const manager = isBoardManager(user, board);
  const author = hasTopicAuthorManagement(user, topic);
  return {
    canManage: manager || author,
    canViewHistory: manager || author,
    canViewIp: manager,
  };
}

export function canManagePost(
  user: AuthUser | null | undefined,
  board: Board | null | undefined,
  topic: Topic | null | undefined,
): boolean {
  if (isBoardManager(user, board)) return true;
  return Boolean(user && board?.id === 144 && topic?.userName === user.name);
}

export function validatePostModerationRequest(request: PostModerationRequest): string | null {
  if (request.action === "unmute") {
    return request.userId ? null : "该楼层缺少用户信息，无法解除 TP";
  }
  if (!request.reason.trim()) return "请输入操作理由";
  if (["delete"].includes(request.action)) return null;
  if (request.action === "mute") {
    return Number.isInteger(request.days) && (request.days ?? 0) > 0 ? null : "请输入有效天数";
  }
  return Number.isInteger(request.value) && (request.value ?? 0) > 0 ? null : "请输入大于 0 的整数";
}

export function validateBatchTopicModerationRequest(
  request: BatchTopicModerationRequest,
): string | null {
  if (request.topicIds.length === 0) return "请至少选择一个主题";
  if (!request.reason.trim()) return "请输入操作理由";
  if (request.action === "lock" && (!Number.isInteger(request.days) || (request.days ?? 0) <= 0)) {
    return "请选择有效天数";
  }
  return null;
}

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
