import type { MessageCounts, SendMessageRequest } from "@cc98/api";
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { typedPost, typedPut } from "../../lib/http";
import { queryKeys, type AuthScope, type NotificationKind } from "../queries/index.ts";

const readAllPath: Record<NotificationKind, string | null> = {
  replies: "/notification/read-all-reply",
  mentions: "/notification/read-all-at",
  system: "/notification/read-all-system",
};

const countField: Record<NotificationKind, keyof MessageCounts> = {
  replies: "replyCount",
  mentions: "atCount",
  system: "systemCount",
};

export function useReadAllNotificationsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ kind }: { kind: NotificationKind; authScope: AuthScope }) => {
      const path = readAllPath[kind];
      if (!path) return;
      await typedPut<void>(path);
    },
    onSuccess: async (_data, { kind, authScope }) => {
      queryClient.setQueryData<MessageCounts>(queryKeys.unreadCounts(authScope), (counts) =>
        counts ? { ...counts, [countField[kind]]: 0 } : counts,
      );
      queryClient.setQueriesData(
        { queryKey: ["messages", "notifications", kind] },
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
