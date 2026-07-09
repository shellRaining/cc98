import { queryOptions } from "@tanstack/vue-query";
import { typedGet } from "../lib/http";
import {
  boardGroupSchema,
  globalConfigSchema,
  meUserSchema,
  postSchema,
  topicSchema,
} from "./schemas";

export const queryKeys = {
  boards: ["boards"] as const,
  board: (id: number) => ["board", id] as const,
  boardTopics: (boardId: number, from: number, size: number) =>
    ["board", boardId, "topics", from, size] as const,
  topic: (id: number) => ["topic", id] as const,
  topicPosts: (topicId: number, from: number, size: number) =>
    ["topic", topicId, "posts", from, size] as const,
  globalConfig: ["global-config"] as const,
  currentUser: ["current-user"] as const,
};

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

export const currentUserQuery = queryOptions({
  queryKey: queryKeys.currentUser,
  queryFn: async () => {
    const data = await typedGet<unknown>("/me");
    return meUserSchema.parse(data);
  },
  staleTime: 5 * 60 * 1000,
});

export const boardTopicsQuery = (boardId: number, from = 0, size = 20) =>
  queryOptions({
    queryKey: queryKeys.boardTopics(boardId, from, size),
    queryFn: async () => {
      const data = await typedGet<unknown[]>(`/board/${boardId}/topic`, {
        query: { from, size },
      });
      return topicSchema.array().parse(data);
    },
  });

export const topicPostsQuery = (topicId: number, from = 0, size = 10) =>
  queryOptions({
    queryKey: queryKeys.topicPosts(topicId, from, size),
    queryFn: async () => {
      const data = await typedGet<unknown[]>(`/topic/${topicId}/post`, {
        query: { from, size },
      });
      return postSchema.array().parse(data);
    },
  });
