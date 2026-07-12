import { describe, expect, test } from "vite-plus/test";
import type { PrivateMessage } from "@cc98/api";
import type { EnrichedNotification } from "../src/api/queries/message.ts";
import {
  createConversationReadSynchronizer,
  mergeConversationPages,
  notificationDescription,
  notificationTopicPath,
  totalUnreadCount,
} from "../src/lib/messages.ts";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

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

describe("消息未读状态", () => {
  test("汇总四类未读数量", () => {
    expect(totalUnreadCount({ systemCount: 1, atCount: 2, replyCount: 3, messageCount: 4 })).toBe(
      10,
    );
    expect(totalUnreadCount(undefined)).toBe(0);
  });
});

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

describe("私信分页合并", () => {
  test("去重后按时间与 ID 正序排列", () => {
    const newer: PrivateMessage = {
      id: 2,
      senderId: 1,
      receiverId: 2,
      content: "新消息",
      time: "2026-07-12T09:00:00Z",
    };
    const older: PrivateMessage = {
      id: 1,
      senderId: 2,
      receiverId: 1,
      content: "旧消息",
      time: "2026-07-12T08:00:00Z",
    };
    expect(mergeConversationPages([[newer], [older, newer]]).map((item) => item.id)).toEqual([
      1, 2,
    ]);
  });
});

describe("会话已读校准", () => {
  test("等待会话网络请求完成后再刷新未读状态", async () => {
    const conversation = deferred();
    const events: string[] = [];
    const synchronizer = createConversationReadSynchronizer({
      refetchConversation: async () => {
        events.push("conversation:start");
        await conversation.promise;
        events.push("conversation:done");
      },
      refreshReadState: async () => {
        events.push("read-state");
      },
      getCurrentUserId: () => 7,
    });

    const synchronization = synchronizer.synchronize(7);
    expect(events).toEqual(["conversation:start"]);
    conversation.resolve();
    await expect(synchronization).resolves.toBe(true);
    expect(events).toEqual(["conversation:start", "conversation:done", "read-state"]);
  });

  test("切换联系人后忽略旧会话完成事件", async () => {
    const first = deferred();
    const second = deferred();
    const conversations = [first, second];
    let currentUserId = 1;
    let refreshCount = 0;
    const synchronizer = createConversationReadSynchronizer({
      refetchConversation: () => conversations.shift()!.promise,
      refreshReadState: async () => {
        refreshCount += 1;
      },
      getCurrentUserId: () => currentUserId,
    });

    const firstSynchronization = synchronizer.synchronize(1);
    currentUserId = 2;
    const secondSynchronization = synchronizer.synchronize(2);
    first.resolve();
    await expect(firstSynchronization).resolves.toBe(false);
    expect(refreshCount).toBe(0);

    second.resolve();
    await expect(secondSynchronization).resolves.toBe(true);
    expect(refreshCount).toBe(1);
  });
});
