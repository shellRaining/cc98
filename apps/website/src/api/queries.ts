import {
  boardSchema,
  boardGroupSchema,
  globalConfigSchema,
  meUserSchema,
  postSchema,
  recommendedTopicSchema,
  topicSchema,
  userSchema,
} from "@cc98/api";
import { infiniteQueryOptions, queryOptions } from "@tanstack/vue-query";
import type { HotPeriod } from "../lib/discovery";
import { typedGet } from "../lib/http";

export type AuthScope = number | "anonymous";

export const queryKeys = {
  boards: ["boards"] as const,
  board: (id: number, authScope: AuthScope) => ["board", id, authScope] as const,
  boardTopics: (boardId: number, from: number, size: number, authScope: AuthScope) =>
    ["board", boardId, "topics", from, size, authScope] as const,
  boardTopTopics: (boardId: number, authScope: AuthScope) =>
    ["board", boardId, "top-topics", authScope] as const,
  topic: (id: number, authScope: AuthScope) => ["topic", id, authScope] as const,
  topicPosts: (topicId: number, from: number, size: number, authScope: AuthScope) =>
    ["topic", topicId, "posts", from, size, authScope] as const,
  hotTopics: (period: HotPeriod) => ["topic", "hot", period] as const,
  newTopics: (size: number, authScope: AuthScope) => ["topic", "new", size, authScope] as const,
  recommendedTopics: (size: number, refreshToken: number, authScope: AuthScope) =>
    ["topic", "recommended", size, refreshToken, authScope] as const,
  searchTopics: (
    keyword: string,
    boardId: number | null,
    from: number,
    size: number,
    authScope: AuthScope,
  ) => ["topic", "search", keyword, boardId, from, size, authScope] as const,
  searchBoards: (keyword: string) => ["board", "search", keyword] as const,
  userById: (id: number, authScope: AuthScope) => ["user", "id", id, authScope] as const,
  userByName: (name: string, authScope: AuthScope) => ["user", "name", name, authScope] as const,
  userRecentTopics: (id: number, size: number, authScope: AuthScope) =>
    ["user", id, "recent-topics", size, authScope] as const,
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

export const hotTopicsQuery = (period: HotPeriod, enabled = true) =>
  queryOptions({
    queryKey: queryKeys.hotTopics(period),
    queryFn: async () => {
      const data = await typedGet<unknown[]>(`/topic/hot-${period}`);
      return topicSchema.array().parse(data);
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });

export const newTopicsInfiniteQuery = (authScope: AuthScope, size = 20, enabled = true) =>
  infiniteQueryOptions({
    queryKey: queryKeys.newTopics(size, authScope),
    queryFn: async ({ pageParam }) => {
      const data = await typedGet<unknown[]>("/topic/new", {
        query: { from: pageParam, size },
      });
      return topicSchema.array().parse(data);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) => {
      if (lastPage.length < size) return undefined;
      return lastPageParam + size;
    },
    enabled: enabled && authScope !== "anonymous",
  });

export const recommendedTopicsQuery = (
  authScope: AuthScope,
  refreshToken: number,
  size = 10,
  enabled = true,
) =>
  queryOptions({
    queryKey: queryKeys.recommendedTopics(size, refreshToken, authScope),
    queryFn: async () => {
      const data = await typedGet<unknown[]>("/topic/random-recommendation", {
        query: { size },
      });
      return recommendedTopicSchema.array().parse(data);
    },
    enabled: enabled && authScope !== "anonymous",
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
  });

export const searchTopicsQuery = (
  keyword: string,
  boardId: number | null,
  authScope: AuthScope,
  from = 0,
  size = 20,
  enabled = true,
) =>
  queryOptions({
    queryKey: queryKeys.searchTopics(keyword, boardId, from, size, authScope),
    queryFn: async () => {
      const path = boardId != null ? `/topic/search/board/${boardId}` : "/topic/search";
      const data = await typedGet<unknown[]>(path, {
        query: { keyword, from, size },
      });
      return topicSchema.array().parse(data);
    },
    enabled: enabled && keyword.length > 0 && authScope !== "anonymous",
  });

export const searchBoardsQuery = (keyword: string, enabled = true) =>
  queryOptions({
    queryKey: queryKeys.searchBoards(keyword),
    queryFn: async () => {
      const data = await typedGet<unknown[]>("/board/search", {
        query: { keyword },
      });
      return boardSchema.array().parse(data);
    },
    enabled: enabled && keyword.length > 0,
    staleTime: 5 * 60 * 1000,
  });

export const userByIdQuery = (userId: number, authScope: AuthScope, enabled = true) =>
  queryOptions({
    queryKey: queryKeys.userById(userId, authScope),
    queryFn: async () => {
      const data = await typedGet<unknown>(`/user/${userId}`);
      return userSchema.parse(data);
    },
    enabled: enabled && userId > 0,
    staleTime: 5 * 60 * 1000,
  });

export const userByNameQuery = (userName: string, authScope: AuthScope, enabled = true) =>
  queryOptions({
    queryKey: queryKeys.userByName(userName, authScope),
    queryFn: async () => {
      const data = await typedGet<unknown>(`/user/name/${encodeURIComponent(userName)}`);
      return userSchema.parse(data);
    },
    enabled: enabled && userName.length > 0,
    staleTime: 5 * 60 * 1000,
  });

export const userRecentTopicsInfiniteQuery = (
  userId: number,
  authScope: AuthScope,
  size = 20,
  enabled = true,
) =>
  infiniteQueryOptions({
    queryKey: queryKeys.userRecentTopics(userId, size, authScope),
    queryFn: async ({ pageParam }) => {
      const data = await typedGet<unknown[]>(`/user/${userId}/recent-topic`, {
        query: { from: pageParam, size },
      });
      return topicSchema.array().parse(data);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) => {
      if (lastPage.length < size) return undefined;
      return lastPageParam + size;
    },
    enabled: enabled && userId > 0 && authScope !== "anonymous",
  });
