import {
  createTopicRequestSchema,
  numericIdResponseSchema,
  submitVoteRequestSchema,
  type CreateTopicRequest,
  type SubmitVoteRequest,
} from "@cc98/api";
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { typedPost } from "../../lib/http";
import { queryKeys, type AuthScope } from "../queries/index.ts";

interface CreateTopicVariables {
  boardId: number;
  authScope: AuthScope;
  payload: CreateTopicRequest;
}

interface SubmitVoteVariables {
  topicId: number;
  authScope: AuthScope;
  payload: SubmitVoteRequest;
}

export function useCreateTopicMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    retry: 0,
    mutationFn: async ({ boardId, payload }: CreateTopicVariables) => {
      const body = createTopicRequestSchema.parse(payload);
      const data = await typedPost<unknown>(`/board/${boardId}/topic`, body);
      return numericIdResponseSchema.parse(data);
    },
    onSuccess: async (_topicId, { boardId, authScope }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.board(boardId, authScope) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.boardTopicsRoot(boardId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.meRecentTopicsRoot }),
      ]);
    },
  });
}

export function useSubmitVoteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    retry: 0,
    mutationFn: async ({ topicId, payload }: SubmitVoteVariables) => {
      const body = submitVoteRequestSchema.parse(payload);
      await typedPost<void>(`/topic/${topicId}/vote`, body);
    },
    onSuccess: async (_data, { topicId, authScope }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.topicVote(topicId, authScope) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.topic(topicId, authScope) }),
      ]);
    },
  });
}
