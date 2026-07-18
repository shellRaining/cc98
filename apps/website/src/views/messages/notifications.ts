import type { MessageCounts } from "@cc98/api";
import type { EnrichedNotification, NotificationKind } from "../../api/queries/message";
import { floorToPage } from "../../lib/route-params";

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
