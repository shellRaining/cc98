import { describe, expect, test } from "vite-plus/test";
import type { PrivateMessage } from "@cc98/api";
import {
  createConversationReadSynchronizer,
  mergeConversationPages,
} from "../src/views/messages/private-messages.ts";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

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
