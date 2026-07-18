import { describe, expect, test } from "vite-plus/test";
import type { EnrichedNotification } from "../src/api/queries/message.ts";
import {
  notificationDescription,
  notificationTopicPath,
} from "../src/views/messages/notifications.ts";

function notification(overrides: Partial<EnrichedNotification> = {}): EnrichedNotification {
  return {
    id: 1,
    kind: "replies",
    type: 2,
    topicId: 42,
    postId: 100,
    time: "2026-07-12T08:00:00Z",
    isRead: false,
    title: null,
    content: null,
    topic: { id: 42, title: "测试主题", boardId: 10 },
    board: { id: 10, name: "测试版面" },
    floor: 20,
    userId: 7,
    userName: "测试用户",
    isDeleted: false,
    ...overrides,
  };
}

describe("通知链接与降级", () => {
  test("使用稳定楼层换算定位整十楼层", () => {
    expect(notificationTopicPath(notification())).toBe("/topic/42/2#floor-20");
  });

  test("删除内容不再生成失效链接", () => {
    expect(notificationTopicPath(notification({ isDeleted: true }))).toBeNull();
    expect(notificationTopicPath(notification({ topicId: null }))).toBeNull();
  });

  test("回复、提及和系统通知使用各自文案", () => {
    expect(notificationDescription(notification())).toContain("回复了你");
    expect(notificationDescription(notification({ kind: "mentions" }))).toContain("提到了你");
    expect(notificationDescription(notification({ kind: "system", content: "系统内容" }))).toBe(
      "系统内容",
    );
  });
});
