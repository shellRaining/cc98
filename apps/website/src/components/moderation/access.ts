import type { Board, Topic } from "@cc98/api";
import type { AuthUser } from "../../stores/user";

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
