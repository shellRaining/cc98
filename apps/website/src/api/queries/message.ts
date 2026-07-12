import {
  boardSchema,
  messageCountsSchema,
  privateMessageSchema,
  recentContactSchema,
  replyOrAtNotificationSchema,
  systemNotificationSchema,
  topicSchema,
  type Board,
  type ReplyOrAtNotification,
  type SystemNotification,
  type Topic,
} from "@cc98/api";
import { infiniteQueryOptions, queryOptions } from "@tanstack/vue-query";
import { typedGet } from "../../lib/http";
import { queryKeys, type AuthScope } from "./keys.ts";

export type NotificationKind = "replies" | "mentions" | "system";

export interface EnrichedNotification {
  id: number;
  kind: NotificationKind;
  type: number;
  topicId: number | null;
  postId: number | null;
  time: string;
  isRead: boolean;
  title: string | null;
  content: string | null;
  topic: Topic | null;
  board: Board | null;
  floor: number | null;
  userId: number | null;
  userName: string | null;
  isDeleted: boolean;
}

const notificationPath: Record<NotificationKind, string> = {
  replies: "/notification/reply",
  mentions: "/notification/at",
  system: "/notification/system",
};

function uniquePositive(values: Array<number | null | undefined>): number[] {
  return [...new Set(values.filter((value): value is number => Boolean(value && value > 0)))];
}

async function enrichNotifications(
  kind: NotificationKind,
  rawItems: unknown[],
): Promise<EnrichedNotification[]> {
  const items: Array<ReplyOrAtNotification | SystemNotification> =
    kind === "system"
      ? systemNotificationSchema.array().parse(rawItems)
      : replyOrAtNotificationSchema.array().parse(rawItems);
  const topicIds = uniquePositive(items.map((item) => item.topicId));
  const topics = topicIds.length
    ? topicSchema
        .array()
        .parse(await typedGet<unknown[]>("/topic/basic", { query: { id: topicIds } }))
    : [];
  const topicMap = new Map(topics.flatMap((topic) => (topic.id ? [[topic.id, topic]] : [])));
  const boardIds = uniquePositive([
    ...topics.map((topic) => topic.boardId),
    ...items.map((item) => item.postBasicInfo?.boardId),
  ]);
  const boards = boardIds.length
    ? boardSchema.array().parse(await typedGet<unknown[]>("/board/", { query: { id: boardIds } }))
    : [];
  const boardMap = new Map(boards.flatMap((board) => (board.id ? [[board.id, board]] : [])));

  return items.map((item) => {
    const topic = item.topicId ? (topicMap.get(item.topicId) ?? null) : null;
    const boardId = topic?.boardId ?? item.postBasicInfo?.boardId;
    const system = kind === "system" ? (item as SystemNotification) : null;
    return {
      id: item.id,
      kind,
      type: item.type,
      topicId: item.topicId,
      postId: item.postId,
      time: item.time,
      isRead: item.isRead,
      title: system?.title ?? null,
      content: system?.content ?? null,
      topic,
      board: boardId ? (boardMap.get(boardId) ?? null) : null,
      floor: item.postBasicInfo?.floor ?? null,
      userId: item.postBasicInfo?.userId ?? null,
      userName: item.postBasicInfo?.userName ?? null,
      isDeleted: item.postBasicInfo?.isDeleted ?? false,
    };
  });
}

export const unreadCountsQuery = (authScope: AuthScope, enabled = true) =>
  queryOptions({
    queryKey: queryKeys.unreadCounts(authScope),
    queryFn: async () => messageCountsSchema.parse(await typedGet<unknown>("/me/unread-count")),
    enabled: enabled && authScope !== "anonymous",
    staleTime: 15 * 1000,
    refetchOnWindowFocus: true,
  });

export const notificationsQuery = (
  kind: NotificationKind,
  authScope: AuthScope,
  from: number,
  size: number,
  enabled = true,
) =>
  queryOptions({
    queryKey: queryKeys.notifications(kind, from, size, authScope),
    queryFn: async () => {
      const data = await typedGet<unknown[]>(notificationPath[kind], { query: { from, size } });
      return enrichNotifications(kind, data);
    },
    enabled: enabled && authScope !== "anonymous",
  });

export const privateContactsInfiniteQuery = (authScope: AuthScope, size = 20, enabled = true) =>
  infiniteQueryOptions({
    queryKey: queryKeys.privateContacts(size, authScope),
    queryFn: async ({ pageParam }) => {
      return recentContactSchema.array().parse(
        await typedGet<unknown[]>("/message/recent-contact-users", {
          query: { from: pageParam, size },
        }),
      );
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.length < size ? undefined : lastPageParam + size,
    enabled: enabled && authScope !== "anonymous",
  });

export const privateConversationInfiniteQuery = (
  userId: number,
  authScope: AuthScope,
  size = 20,
  enabled = true,
) =>
  infiniteQueryOptions({
    queryKey: queryKeys.privateConversation(userId, size, authScope),
    queryFn: async ({ pageParam }) => {
      const data = await typedGet<unknown[]>(`/message/user/${userId}`, {
        query: { from: pageParam, size },
      });
      return privateMessageSchema.array().parse(data);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.length < size ? undefined : lastPageParam + size,
    enabled: enabled && userId > 0 && authScope !== "anonymous",
  });
