import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { typedDelete, typedPost, typedPut } from "../../lib/http";
import { queryKeys, type AuthScope } from "../queries/index.ts";

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

export function moderateTopic(request: TopicModerationRequest): Promise<void> {
  const reasonBody = { reason: request.reason.trim() };
  const path = `/topic/${request.topicId}`;
  switch (request.action) {
    case "lock":
      return typedPut<void>(`${path}/lock`, { ...reasonBody, value: request.days });
    case "unlock":
      return typedDelete<void>(`${path}/lock`, { body: reasonBody });
    case "disable-hot":
      return typedPut<void>(`${path}/not-hot`, reasonBody);
    case "enable-hot":
      return typedDelete<void>(`${path}/not-hot`, { body: reasonBody });
    case "delete":
      return typedDelete<void>(path, { body: reasonBody });
    case "move":
      return typedPut<void>(`${path}/moveto/${request.targetBoardId}`, reasonBody);
    case "bump":
      return typedPut<void>(`${path}/up`, reasonBody);
    case "set-board-top":
      return typedPut<void>(`${path}/top`, {
        topState: 2,
        duration: request.days,
        ...reasonBody,
      });
    case "set-global-top":
      return typedPut<void>(`${path}/top`, {
        topState: 4,
        duration: request.days,
        ...reasonBody,
      });
    case "remove-top":
      return typedDelete<void>(`${path}/top`, { body: reasonBody });
    case "set-best":
      return typedPut<void>(`${path}/best`, reasonBody);
    case "remove-best":
      return typedDelete<void>(`${path}/best`, { body: reasonBody });
    case "highlight":
      return typedPut<void>(`${path}/highlight`, {
        isBold: request.isBold ?? false,
        isItalic: request.isItalic ?? false,
        color: request.color,
        duration: request.days,
        ...reasonBody,
      });
  }
}

export function useModerateTopicMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    retry: 0,
    mutationFn: ({
      request,
    }: {
      request: TopicModerationRequest;
      boardId: number;
      authScope: AuthScope;
    }) => moderateTopic(request),
    onSuccess: async (_data, { request, boardId }) => {
      const affectedBoardIds = [boardId, request.targetBoardId].filter(
        (id): id is number => id != null,
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.topicRoot(request.topicId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.boards }),
        ...affectedBoardIds.map((id) =>
          queryClient.invalidateQueries({ queryKey: queryKeys.boardRoot(id) }),
        ),
      ]);
    },
  });
}

export function moderatePost(request: PostModerationRequest): Promise<void> {
  const reason = request.reason.trim();
  if (request.action === "delete") {
    return typedDelete<void>(`/post/${request.postId}`, { body: { reason } });
  }
  if (request.action === "unmute") {
    return typedDelete<void>(`/board/${request.boardId}/stop-post-user/${request.userId}`);
  }

  const operationType = request.action.startsWith("reward-") ? 0 : 1;
  return typedPost<void>(`/post/${request.postId}/operation`, {
    operationType,
    reason,
    ...(request.action.endsWith("wealth") ? { wealth: request.value } : {}),
    ...(request.action.endsWith("prestige") ? { prestige: request.value } : {}),
    ...(request.action === "mute" ? { stopPostDays: request.days } : {}),
  });
}

export function useModeratePostMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    retry: 0,
    mutationFn: ({ request }: { request: PostModerationRequest; topicId: number }) =>
      moderatePost(request),
    onSuccess: async (_data, { request, topicId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.topicRoot(topicId) }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.postRewardDailyRecordRoot(request.boardId),
        }),
      ]);
    },
  });
}

export function batchModerateTopics(request: BatchTopicModerationRequest): Promise<void> {
  return typedPut<void>(
    request.action === "lock" ? "/topic/multi-lock" : "/topic/multi-delete",
    {
      reason: request.reason.trim(),
      ...(request.action === "lock" ? { value: request.days } : {}),
    },
    { query: { id: request.topicIds } },
  );
}

export function useBatchModerateTopicsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    retry: 0,
    mutationFn: ({ request }: { request: BatchTopicModerationRequest; boardId: number }) =>
      batchModerateTopics(request),
    onSuccess: async (_data, { boardId }) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.boardRoot(boardId) });
    },
  });
}
