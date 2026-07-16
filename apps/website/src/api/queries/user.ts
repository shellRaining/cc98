import { basicUserSchema, topicSchema, userSchema } from "@cc98/api";
import { infiniteQueryOptions, queryOptions } from "@tanstack/vue-query";
import { typedGet } from "../../lib/http";
import { queryKeys, type AuthScope } from "./keys.ts";

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
      if (lastPage.length < size || lastPageParam + size >= 200) return undefined;
      return lastPageParam + size;
    },
    enabled: enabled && userId > 0 && authScope !== "anonymous",
  });

export const usersByIdsQuery = (ids: number[], enabled = true) => {
  const normalizedIds = [...new Set(ids.filter((id) => id > 0))];
  return queryOptions({
    queryKey: queryKeys.usersByIds(normalizedIds),
    queryFn: async () => {
      const data = await typedGet<unknown[]>("/user/basic", { query: { id: normalizedIds } });
      return basicUserSchema.array().parse(data);
    },
    enabled: enabled && normalizedIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });
};

export const fullUsersByIdsQuery = (ids: number[], authScope: AuthScope, enabled = true) => {
  const normalizedIds = [...new Set(ids.filter((id) => id > 0))];
  return queryOptions({
    queryKey: queryKeys.fullUsersByIds(normalizedIds, authScope),
    queryFn: async () => {
      const data = await typedGet<unknown[]>("/user", { query: { id: normalizedIds } });
      return userSchema.array().parse(data);
    },
    enabled: enabled && normalizedIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });
};
