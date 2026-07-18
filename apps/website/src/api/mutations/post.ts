import {
  createPostRequestSchema,
  editPostRequestSchema,
  postLikeActionSchema,
  postRatingRequestSchema,
  numericIdResponseSchema,
  type CreatePostRequest,
  type EditPostRequest,
  type Like,
  type Post,
  type PostLikeAction,
  type PostRatingRequest,
} from "@cc98/api";
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { typedPost, typedPut } from "../../lib/http";
import { queryKeys, type AuthScope } from "../queries/index.ts";

export function nextLikeState(current: Like, action: PostLikeAction): Like {
  const target = Number(action) as 1 | 2;
  const previous = current.likeState ?? 0;
  const next = previous === target ? 0 : target;
  let likeCount = current.likeCount ?? 0;
  let dislikeCount = current.dislikeCount ?? 0;

  if (previous === 1) likeCount = Math.max(0, likeCount - 1);
  if (previous === 2) dislikeCount = Math.max(0, dislikeCount - 1);
  if (next === 1) likeCount += 1;
  if (next === 2) dislikeCount += 1;

  return { likeCount, dislikeCount, likeState: next };
}

interface CreatePostVariables {
  topicId: number;
  authScope: AuthScope;
  payload: CreatePostRequest;
}

interface EditPostVariables {
  postId: number;
  topicId: number;
  boardId?: number;
  authScope: AuthScope;
  payload: EditPostRequest;
}

interface LikePostVariables {
  postId: number;
  topicId: number;
  action: PostLikeAction;
}

interface RatePostVariables {
  postId: number;
  topicId: number;
  authScope: AuthScope;
  payload: PostRatingRequest;
}

export function useCreatePostMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    retry: 0,
    mutationFn: async ({ topicId, payload }: CreatePostVariables) => {
      const body = createPostRequestSchema.parse(payload);
      const data = await typedPost<unknown>(`/topic/${topicId}/post`, body);
      return numericIdResponseSchema.parse(data);
    },
    onSuccess: async (_postId, { topicId, authScope }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.topic(topicId, authScope) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.topicPostsRoot(topicId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.mePostsRoot }),
      ]);
    },
  });
}

export function useEditPostMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    retry: 0,
    mutationFn: async ({ postId, payload }: EditPostVariables) => {
      const body = editPostRequestSchema.parse(payload);
      await typedPut<void>(`/post/${postId}`, body);
    },
    onSuccess: async (_data, { postId, topicId, boardId, authScope }) => {
      const invalidations = [
        queryClient.invalidateQueries({ queryKey: queryKeys.postOriginal(postId, authScope) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.topic(topicId, authScope) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.topicPostsRoot(topicId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.mePostsRoot }),
        queryClient.invalidateQueries({ queryKey: queryKeys.meRecentTopicsRoot }),
      ];
      if (boardId != null) {
        invalidations.push(
          queryClient.invalidateQueries({ queryKey: queryKeys.boardTopicsRoot(boardId) }),
        );
      }
      await Promise.all(invalidations);
    },
  });
}

export function useLikePostMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    retry: 0,
    mutationFn: async ({ postId, action }: LikePostVariables) => {
      const body = postLikeActionSchema.parse(action);
      await typedPut<void>(`/post/${postId}/like`, body);
    },
    onMutate: async ({ postId, topicId, action }) => {
      const queryKey = queryKeys.topicPostsRoot(topicId);
      await queryClient.cancelQueries({ queryKey });
      const previousQueries = queryClient.getQueriesData<Post[]>({ queryKey });
      queryClient.setQueriesData<Post[]>({ queryKey }, (posts) =>
        posts?.map((post) =>
          post.id === postId ? { ...post, ...nextLikeState(post, action) } : post,
        ),
      );
      return { previousQueries };
    },
    onError: (_error, _variables, context) => {
      for (const [queryKey, posts] of context?.previousQueries ?? []) {
        queryClient.setQueryData(queryKey, posts);
      }
    },
    onSettled: async (_data, _error, { topicId }) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.topicPostsRoot(topicId) });
    },
  });
}

export function useRatePostMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    retry: 0,
    mutationFn: async ({ postId, payload }: RatePostVariables) => {
      const body = postRatingRequestSchema.parse(payload);
      await typedPut<void>(`/post/${postId}/rating-v2`, body);
    },
    onSuccess: async (_data, { topicId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.topicPostsRoot(topicId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.mePostsRoot }),
      ]);
    },
  });
}
