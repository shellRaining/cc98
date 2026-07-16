import type { MessageCounts, SendMessageRequest } from "@cc98/api";
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { typedPost, typedPut } from "../../lib/http";
import { queryKeys, type AuthScope, type NotificationKind } from "../queries/index.ts";

const readAllPath: Record<NotificationKind, string | null> = {
  replies: "/notification/read-all-reply",
  mentions: "/notification/read-all-at",
  system: "/notification/read-all-system",
};

export function useReadAllNotificationKindsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ authScope: _authScope }: { authScope: AuthScope }) => {
      await Promise.all(
        Object.values(readAllPath).flatMap((path) => (path ? [typedPut<void>(path)] : [])),
      );
    },
    onSuccess: async (_data, { authScope }) => {
      queryClient.setQueryData<MessageCounts>(queryKeys.unreadCounts(authScope), (counts) =>
        counts ? { ...counts, replyCount: 0, atCount: 0, systemCount: 0 } : counts,
      );
      queryClient.setQueriesData(
        { queryKey: queryKeys.notificationsRoot },
        (items: Array<{ isRead: boolean }> | undefined) =>
          items?.map((item) => ({ ...item, isRead: true })),
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.unreadCountsRoot }),
        queryClient.invalidateQueries({ queryKey: queryKeys.notificationsRoot }),
      ]);
    },
  });
}

export function useSendPrivateMessageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: SendMessageRequest & { authScope: AuthScope }) => {
      const { authScope: _authScope, ...body } = request;
      return typedPost<unknown>("/message", body);
    },
    onSuccess: async (_data, { receiverId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.privateConversationRoot }),
        queryClient.invalidateQueries({ queryKey: queryKeys.privateContactsRoot }),
        queryClient.invalidateQueries({ queryKey: queryKeys.unreadCountsRoot }),
        queryClient.invalidateQueries({ queryKey: queryKeys.usersByIdRoot(receiverId) }),
      ]);
    },
  });
}
