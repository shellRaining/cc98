import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { typedDelete, typedPut } from "../../lib/http";
import type { TopicModerationRequest } from "../../lib/moderation";
import { queryKeys, type AuthScope } from "../queries/index.ts";

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
