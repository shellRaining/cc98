import {
  boardGroupSchema,
  boardSchema,
  globalConfigSchema,
  postSchema,
  ratingReasonSchema,
  tagGroupSchema,
  topicSchema,
  voteInfoSchema,
  type PostRatingType,
} from "@cc98/api";
import { queryOptions } from "@tanstack/vue-query";
import { typedGet } from "../../lib/http";
import { queryKeys, type AuthScope } from "./keys.ts";

export const boardsQuery = queryOptions({
  queryKey: queryKeys.boards,
  queryFn: async () => {
    const data = await typedGet<unknown[]>("/board/all");
    return boardGroupSchema.array().parse(data);
  },
  staleTime: 30 * 60 * 1000,
});

export const globalConfigQuery = queryOptions({
  queryKey: queryKeys.globalConfig,
  queryFn: async () => {
    const data = await typedGet<unknown>("/config/global");
    return globalConfigSchema.parse(data);
  },
  staleTime: 5 * 60 * 1000,
});

export const boardQuery = (boardId: number, authScope: AuthScope, enabled = true) =>
  queryOptions({
    queryKey: queryKeys.board(boardId, authScope),
    queryFn: async () => {
      const data = await typedGet<unknown>(`/board/${boardId}`);
      return boardSchema.parse(data);
    },
    enabled: enabled && boardId > 0,
    staleTime: 5 * 60 * 1000,
  });

export const boardTopicsQuery = (
  boardId: number,
  authScope: AuthScope,
  from = 0,
  size = 20,
  enabled = true,
) =>
  queryOptions({
    queryKey: queryKeys.boardTopics(boardId, from, size, authScope),
    queryFn: async () => {
      const data = await typedGet<unknown[]>(`/board/${boardId}/topic`, {
        query: { from, size },
      });
      return topicSchema.array().parse(data);
    },
    enabled: enabled && boardId > 0,
  });

export const boardTopTopicsQuery = (boardId: number, authScope: AuthScope, enabled = true) =>
  queryOptions({
    queryKey: queryKeys.boardTopTopics(boardId, authScope),
    queryFn: async () => {
      const data = await typedGet<unknown[]>("/topic/toptopics", {
        query: { boardid: boardId },
      });
      return topicSchema.array().parse(data);
    },
    enabled: enabled && boardId > 0,
  });

export const boardTagsQuery = (boardId: number, enabled = true) =>
  queryOptions({
    queryKey: queryKeys.boardTags(boardId),
    queryFn: async () => {
      const data = await typedGet<unknown[]>(`/board/${boardId}/tag`);
      return tagGroupSchema.array().parse(data);
    },
    enabled: enabled && boardId > 0,
    staleTime: 30 * 60 * 1000,
  });

export const topicQuery = (topicId: number, authScope: AuthScope, enabled = true) =>
  queryOptions({
    queryKey: queryKeys.topic(topicId, authScope),
    queryFn: async () => {
      const data = await typedGet<unknown>(`/topic/${topicId}`);
      return topicSchema.parse(data);
    },
    enabled: enabled && topicId > 0,
  });

export const topicPostsQuery = (
  topicId: number,
  authScope: AuthScope,
  from = 0,
  size = 10,
  enabled = true,
) =>
  queryOptions({
    queryKey: queryKeys.topicPosts(topicId, from, size, authScope),
    queryFn: async () => {
      const data = await typedGet<unknown[]>(`/topic/${topicId}/post`, {
        query: { from, size },
      });
      return postSchema.array().parse(data);
    },
    enabled: enabled && topicId > 0,
  });

export const postOriginalQuery = (postId: number, authScope: AuthScope, enabled = true) =>
  queryOptions({
    queryKey: queryKeys.postOriginal(postId, authScope),
    queryFn: async () => {
      const data = await typedGet<unknown>(`/post/${postId}/original`);
      return postSchema.parse(data);
    },
    enabled: enabled && postId > 0,
  });

export const ratingReasonsQuery = (type: PostRatingType, enabled = true) =>
  queryOptions({
    queryKey: queryKeys.ratingReasons(type),
    queryFn: async () => {
      const data = await typedGet<unknown[]>("/post/rating-reason", { query: { type } });
      return ratingReasonSchema.array().parse(data);
    },
    enabled,
    staleTime: 30 * 60 * 1000,
  });

export const topicFavoriteQuery = (topicId: number, authScope: AuthScope, enabled = true) =>
  queryOptions({
    queryKey: queryKeys.topicFavorite(topicId, authScope),
    queryFn: async () => {
      const data = await typedGet<unknown>(`/topic/${topicId}/isfavorite`);
      return typeof data === "boolean" ? data : false;
    },
    enabled: enabled && topicId > 0,
  });

export const topicVoteQuery = (topicId: number, authScope: AuthScope, enabled = true) =>
  queryOptions({
    queryKey: queryKeys.topicVote(topicId, authScope),
    queryFn: async () => {
      const data = await typedGet<unknown>(`/topic/${topicId}/vote`);
      return voteInfoSchema.parse(data);
    },
    enabled: enabled && topicId > 0,
  });

export const boardsByIdsQuery = (ids: number[], enabled = true) => {
  const normalizedIds = [...new Set(ids.filter((id) => id > 0))];
  return queryOptions({
    queryKey: queryKeys.boardsByIds(normalizedIds),
    queryFn: async () => {
      const data = await typedGet<unknown[]>("/board/", { query: { id: normalizedIds } });
      return boardSchema.array().parse(data);
    },
    enabled: enabled && normalizedIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });
};
