import {
  createPostRequestSchema,
  editPostRequestSchema,
  likeSchema,
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
import { type QueryClient, type QueryKey, useMutation, useQueryClient } from "@tanstack/vue-query";
import { typedGet, typedPost, typedPut } from "../../lib/http";
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

interface LikePostMutationContext {
  previousQueries: Array<[QueryKey, Post[] | undefined]>;
}

interface RatePostVariables {
  postId: number;
  topicId: number;
  authScope: AuthScope;
  payload: PostRatingRequest;
}

function topicPostQueryRoots(topicId: number) {
  return [queryKeys.topicPostsRoot(topicId), queryKeys.topicHotPostsRoot(topicId)];
}

function setCachedPostLikeState(
  queryClient: QueryClient,
  topicId: number,
  postId: number,
  state: Like,
) {
  for (const queryKey of topicPostQueryRoots(topicId)) {
    queryClient.setQueriesData<Post[]>({ queryKey }, (posts) =>
      posts?.map((post) => (post.id === postId ? { ...post, ...state } : post)),
    );
  }
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

export function createLikePostMutationOptions(queryClient: QueryClient) {
  return {
    retry: 0,
    mutationFn: async ({ postId, action }: LikePostVariables) => {
      const body = postLikeActionSchema.parse(action);
      await typedPut<void>(`/post/${postId}/like`, body);
    },
    onMutate: async ({ postId, topicId, action }: LikePostVariables) => {
      const queryRoots = topicPostQueryRoots(topicId);
      await Promise.all(queryRoots.map((queryKey) => queryClient.cancelQueries({ queryKey })));
      const previousQueries = queryRoots.flatMap((queryKey) =>
        queryClient.getQueriesData<Post[]>({ queryKey }),
      );
      const current = previousQueries
        .flatMap(([, posts]) => posts ?? [])
        .find((post) => post.id === postId);
      if (current) {
        setCachedPostLikeState(queryClient, topicId, postId, nextLikeState(current, action));
      }
      return { previousQueries };
    },
    onError: (
      _error: Error,
      _variables: LikePostVariables,
      context: LikePostMutationContext | undefined,
    ) => {
      for (const [queryKey, posts] of context?.previousQueries ?? []) {
        queryClient.setQueryData(queryKey, posts);
      }
    },
    onSuccess: async (_data: void, { postId, topicId }: LikePostVariables) => {
      try {
        const data = await typedGet<unknown>(`/post/${postId}/like`);
        setCachedPostLikeState(queryClient, topicId, postId, likeSchema.parse(data));
      } catch {
        // PUT 已成功时保留乐观状态，单独状态接口会在下次交互时再次校正。
      }
    },
  };
}

export function useLikePostMutation() {
  return useMutation(createLikePostMutationOptions(useQueryClient()));
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
