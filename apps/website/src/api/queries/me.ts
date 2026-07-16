import {
  annualReviewV2Schema,
  basicUserSchema,
  meUserSchema,
  pagedFavoriteTopicGroupSchema,
  pagedPostResultSchema,
  pagedTopicResultDataSchema,
  topicSchema,
} from "@cc98/api";
import { infiniteQueryOptions, queryOptions } from "@tanstack/vue-query";
import type { FocusMode } from "../../lib/discovery";
import { typedGet } from "../../lib/http";
import { queryKeys, type AuthScope } from "./keys.ts";

export const currentUserQuery = queryOptions({
  queryKey: queryKeys.currentUser,
  queryFn: async () => {
    const data = await typedGet<unknown>("/me");
    return meUserSchema.parse(data);
  },
  staleTime: 5 * 60 * 1000,
});

export const annualReviewQuery = (year: number, authScope: AuthScope, enabled = true) =>
  queryOptions({
    queryKey: queryKeys.annualReview(year, authScope),
    queryFn: async () => {
      const data = await typedGet<unknown>(`/me/annual-review-${year}`);
      return annualReviewV2Schema.parse(data);
    },
    staleTime: 30 * 60 * 1000,
    enabled: enabled && authScope !== "anonymous",
  });

export const focusTopicsInfiniteQuery = (
  mode: FocusMode,
  boardId: number,
  authScope: AuthScope,
  size = 20,
  enabled = true,
) =>
  infiniteQueryOptions({
    queryKey: queryKeys.focusTopics(mode, boardId, size, authScope),
    queryFn: async ({ pageParam }) => {
      const path =
        mode === "user"
          ? "/me/followee/topic"
          : mode === "favorite"
            ? "/topic/me/favorite"
            : boardId > 0
              ? `/board/${boardId}/topic`
              : "/me/custom-board/topic";
      const query = {
        from: pageParam,
        size,
        ...(mode === "user" ? { order: 0 } : {}),
        ...(mode === "favorite" ? { order: 1 } : {}),
      };
      const data = await typedGet<unknown[]>(path, { query });
      return topicSchema.array().parse(data);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) => {
      if (lastPage.length < size || lastPageParam + size >= 200) return undefined;
      return lastPageParam + size;
    },
    enabled: enabled && authScope !== "anonymous",
  });

export const meRecentTopicsQuery = (
  authScope: AuthScope,
  from: number,
  size: number,
  enabled = true,
) =>
  queryOptions({
    queryKey: queryKeys.meRecentTopics(from, size, authScope),
    queryFn: async () => {
      const data = await typedGet<unknown[]>("/me/recent-topic", { query: { from, size } });
      return topicSchema.array().parse(data);
    },
    enabled: enabled && authScope !== "anonymous",
  });

export const mePostsQuery = (
  kind: "recent" | "hot",
  authScope: AuthScope,
  from: number,
  size: number,
  enabled = true,
) =>
  queryOptions({
    queryKey: queryKeys.mePosts(kind, from, size, authScope),
    queryFn: async () => {
      const data = await typedGet<unknown>(`/me/${kind}-post`, { query: { from, size } });
      return pagedPostResultSchema.parse(data);
    },
    enabled: enabled && authScope !== "anonymous",
  });

export const meFavoritesQuery = (
  authScope: AuthScope,
  groupId: number,
  order: number,
  keyword: string,
  from: number,
  size: number,
  enabled = true,
) =>
  queryOptions({
    queryKey: queryKeys.meFavorites(groupId, order, keyword, from, size, authScope),
    queryFn: async () => {
      const path = keyword ? "/topic/me/search-favorite" : "/topic/me/favorite";
      const query = keyword ? { keyword, from, size } : { from, size, order, groupid: groupId };
      const data = await typedGet<unknown[]>(path, { query });
      return topicSchema.array().parse(data);
    },
    enabled: enabled && authScope !== "anonymous",
  });

export const meFavoriteGroupsQuery = (authScope: AuthScope, enabled = true) =>
  queryOptions({
    queryKey: queryKeys.meFavoriteGroups(authScope),
    queryFn: async () => {
      const data = await typedGet<unknown>("/me/favorite-topic-group");
      return pagedFavoriteTopicGroupSchema.parse(data);
    },
    enabled: enabled && authScope !== "anonymous",
  });

export const meBrowsingRecordsQuery = (
  authScope: AuthScope,
  from: number,
  size: number,
  enabled = true,
) =>
  queryOptions({
    queryKey: queryKeys.meBrowsingRecords(from, size, authScope),
    queryFn: async () => {
      const data = await typedGet<unknown>("/me/browsing-record", { query: { from, size } });
      return pagedTopicResultDataSchema.parse(data);
    },
    enabled: enabled && authScope !== "anonymous",
  });

export const meRelationIdsQuery = (
  kind: "following" | "followers",
  authScope: AuthScope,
  from: number,
  size: number,
  enabled = true,
) =>
  queryOptions({
    queryKey: queryKeys.meRelationIds(kind, from, size, authScope),
    queryFn: async () => {
      const path = kind === "following" ? "/me/followee" : "/me/follower";
      const data = await typedGet<unknown[]>(path, { query: { from, size } });
      return basicUserSchema.shape.id.array().parse(data);
    },
    enabled: enabled && authScope !== "anonymous",
  });
