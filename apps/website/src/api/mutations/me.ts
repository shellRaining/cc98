import type { MeUser, Topic } from "@cc98/api";
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { typedDelete, typedPost, typedPut } from "../../lib/http";
import { queryKeys } from "../queries/index.ts";

export function withoutTopic<T extends { id?: number }>(topics: T[] | undefined, topicId: number) {
  return topics?.filter((topic) => topic.id !== topicId);
}

export function withoutId(ids: number[] | undefined, targetId: number) {
  return ids?.filter((id) => id !== targetId);
}

export function withoutCustomBoard(me: MeUser | undefined, boardId: number) {
  return me ? { ...me, customBoards: withoutId(me.customBoards, boardId) } : undefined;
}

function favoriteInvalidation(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["me", "favorites"] }),
    queryClient.invalidateQueries({ queryKey: ["me", "favorite-groups"] }),
  ]);
}

export function useCreateFavoriteGroupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => typedPost<void>("/me/favorite-topic-group", { name }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["me", "favorite-groups"] }),
  });
}

export function useRenameFavoriteGroupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      typedPut<void>("/me/favorite-topic-group", { id, name }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["me", "favorite-groups"] }),
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
      queryClient.setQueriesData<Topic[]>({ queryKey: ["me", "favorites"] }, (topics) =>
        withoutTopic(topics, topicId),
      );
      await favoriteInvalidation(queryClient);
    },
  });
}

export function useUnfollowUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => typedDelete<void>(`/me/followee/${userId}`),
    onSuccess: async (_data, userId) => {
      queryClient.setQueriesData<number[]>({ queryKey: ["me", "relations", "following"] }, (ids) =>
        withoutId(ids, userId),
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["me", "relations", "following"] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.currentUser }),
        queryClient.invalidateQueries({ queryKey: ["user", "id", userId] }),
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
        queryClient.invalidateQueries({ queryKey: ["boards", "batch"] }),
        queryClient.invalidateQueries({ queryKey: ["board", boardId] }),
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
