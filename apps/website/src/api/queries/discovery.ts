import { boardSchema, recommendedTopicSchema, tagSchema, topicSchema } from "@cc98/api";
import { infiniteQueryOptions, queryOptions } from "@tanstack/vue-query";
import type { HotPeriod } from "../../lib/discovery";
import { typedGet } from "../../lib/http";
import { queryKeys, type AuthScope } from "./keys.ts";

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

export const globalTagsQuery = queryOptions({
  queryKey: queryKeys.globalTags,
  queryFn: async () => tagSchema.array().parse(await typedGet<unknown[]>("/config/global/alltag")),
  staleTime: 30 * 60 * 1000,
});

export const newTopicsInfiniteQuery = (
  mode: "all" | "media",
  authScope: AuthScope,
  size = 20,
  enabled = true,
) =>
  infiniteQueryOptions({
    queryKey: queryKeys.newTopics(mode, size, authScope),
    queryFn: async ({ pageParam }) => {
      const data = await typedGet<unknown[]>(mode === "media" ? "/topic/new-media" : "/topic/new", {
        query: { from: pageParam, size },
      });
      return topicSchema.array().parse(data);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) => {
      if (lastPage.length < size || lastPageParam + size >= 500) return undefined;
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
