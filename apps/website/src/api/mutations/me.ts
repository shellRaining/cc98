import type { MeUser, Topic } from "@cc98/api";
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { typedDelete, typedPost, typedPut } from "../../lib/http";
import { queryKeys, type AuthScope } from "../queries/index.ts";

export function withoutTopic<T extends { id?: number }>(topics: T[] | undefined, topicId: number) {
  return topics?.filter((topic) => topic.id !== topicId);
}

export function withoutId(ids: number[] | undefined, targetId: number) {
  return ids?.filter((id) => id !== targetId);
}

export function withoutCustomBoard(me: MeUser | undefined, boardId: number) {
  return me ? { ...me, customBoards: withoutId(me.customBoards, boardId) } : undefined;
}

export function favoriteCacheQueryKeys(topicId: number) {
  return [
    queryKeys.topicFavoriteRoot(topicId),
    queryKeys.meFavoritesRoot,
    queryKeys.meFavoriteGroupsRoot,
    queryKeys.currentUser,
  ] as const;
}

function favoriteInvalidation(queryClient: ReturnType<typeof useQueryClient>, topicId?: number) {
  const keys = topicId
    ? favoriteCacheQueryKeys(topicId)
    : [queryKeys.meFavoritesRoot, queryKeys.meFavoriteGroupsRoot, queryKeys.currentUser];
  return Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
}

export function useAddFavoriteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    retry: 0,
    mutationFn: ({
      topicId,
      groupId,
    }: {
      topicId: number;
      groupId: number | null;
      authScope: AuthScope;
    }) =>
      typedPut<void>(
        `/me/favorite/${topicId}`,
        undefined,
        groupId == null ? undefined : { query: { groupid: groupId } },
      ),
    onSuccess: async (_data, { topicId, authScope }) => {
      queryClient.setQueryData(queryKeys.topicFavorite(topicId, authScope), true);
      await favoriteInvalidation(queryClient, topicId);
    },
  });
}

export function useCreateFavoriteGroupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => typedPost<void>("/me/favorite-topic-group", { name }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.meFavoriteGroupsRoot }),
  });
}

export function useRenameFavoriteGroupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      typedPut<void>("/me/favorite-topic-group", { id, name }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.meFavoriteGroupsRoot }),
  });
}

export function useDeleteFavoriteGroupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupId: number) =>
      typedDelete<void>("/me/favorite-topic-group", { query: { groupid: groupId } }),
    onSuccess: () => favoriteInvalidation(queryClient),
  });
}

export function useMoveFavoriteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ topicId, groupId }: { topicId: number; groupId: number }) =>
      typedPut<void>(`/me/favorite/${topicId}`, undefined, { query: { groupid: groupId } }),
    onSuccess: () => favoriteInvalidation(queryClient),
  });
}

export function useRemoveFavoriteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (topicId: number) => typedDelete<void>(`/me/favorite/${topicId}`),
    onSuccess: async (_data, topicId) => {
      queryClient.setQueriesData<Topic[]>({ queryKey: queryKeys.meFavoritesRoot }, (topics) =>
        withoutTopic(topics, topicId),
      );
      queryClient.setQueriesData<boolean>(
        { queryKey: queryKeys.topicFavoriteRoot(topicId) },
        false,
      );
      await favoriteInvalidation(queryClient, topicId);
    },
  });
}

export function useUnfollowUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => typedDelete<void>(`/me/followee/${userId}`),
    onSuccess: async (_data, userId) => {
      queryClient.setQueriesData<number[]>({ queryKey: queryKeys.meFollowingRoot }, (ids) =>
        withoutId(ids, userId),
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.meFollowingRoot }),
        queryClient.invalidateQueries({ queryKey: queryKeys.currentUser }),
        queryClient.invalidateQueries({ queryKey: queryKeys.usersByIdRoot(userId) }),
      ]);
    },
  });
}

export function useUnfollowBoardMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (boardId: number) => typedDelete<void>(`/me/custom-board/${boardId}`),
    onSuccess: async (_data, boardId) => {
      queryClient.setQueryData<MeUser>(queryKeys.currentUser, (me) =>
        withoutCustomBoard(me, boardId),
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.currentUser }),
        queryClient.invalidateQueries({ queryKey: queryKeys.boardsByIdsRoot }),
        queryClient.invalidateQueries({ queryKey: queryKeys.boardRoot(boardId) }),
      ]);
    },
  });
}

export function useSetBrowsingHistoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (enabled: boolean) =>
      typedPut<void>("/me/browsing-history", undefined, { query: { enabled } }),
    onSuccess: async (_data, enabled) => {
      queryClient.setQueryData<MeUser>(queryKeys.currentUser, (me) =>
        me ? { ...me, browsingHistoryEnabled: enabled } : undefined,
      );
      await queryClient.invalidateQueries({ queryKey: queryKeys.currentUser });
    },
  });
}
