import type { MessageCounts, PrivateMessage } from "@cc98/api";
import type { EnrichedNotification, NotificationKind } from "../api/queries/message";
import { floorToPage } from "./route-params";

interface ConversationReadSynchronizerDeps {
  refetchConversation: () => Promise<unknown>;
  refreshReadState: () => Promise<unknown>;
  getCurrentUserId: () => number;
}

export interface ConversationReadSynchronizer {
  cancel: () => void;
  synchronize: (userId: number) => Promise<boolean>;
}

export function createConversationReadSynchronizer(
  deps: ConversationReadSynchronizerDeps,
): ConversationReadSynchronizer {
  let generation = 0;
  return {
    cancel() {
      generation += 1;
    },
    async synchronize(userId) {
      const currentGeneration = ++generation;
      await deps.refetchConversation();
      if (currentGeneration !== generation || deps.getCurrentUserId() !== userId) return false;
      await deps.refreshReadState();
      return true;
    },
  };
}

export function totalUnreadCount(counts: MessageCounts | undefined): number {
  if (!counts) return 0;
  return counts.systemCount + counts.atCount + counts.replyCount + counts.messageCount;
}

export function notificationTopicPath(item: EnrichedNotification): string | null {
  if (!item.topicId || item.isDeleted) return null;
  if (!item.floor) return `/topic/${item.topicId}`;
  return `/topic/${item.topicId}/${floorToPage(item.floor)}#floor-${item.floor}`;
}

export function notificationDescription(item: EnrichedNotification): string {
  if (item.kind === "system") return item.content ?? "系统通知";
  const actor = item.userName || "有人";
  const topic = item.topic?.title?.trim() || "一个主题";
  return item.kind === "replies"
    ? `${actor} 在《${topic}》中回复了你。`
    : `${actor} 在《${topic}》中提到了你。`;
}

export function notificationCount(
  counts: MessageCounts | undefined,
  kind: NotificationKind,
): number {
  if (!counts) return 0;
  if (kind === "replies") return counts.replyCount;
  if (kind === "mentions") return counts.atCount;
  return counts.systemCount;
}

export function mergeConversationPages(pages: PrivateMessage[][] | undefined): PrivateMessage[] {
  const messages = pages?.flat() ?? [];
  const seen = new Set<number | string>();
  return messages
    .filter((message) => {
      const key = message.id ?? `${message.senderId}-${message.receiverId}-${message.time}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => {
      const timeDiff = Date.parse(a.time ?? "") - Date.parse(b.time ?? "");
      if (Number.isFinite(timeDiff) && timeDiff !== 0) return timeDiff;
      return (a.id ?? 0) - (b.id ?? 0);
    });
}
