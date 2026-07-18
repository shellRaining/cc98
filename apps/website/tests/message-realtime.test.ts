import { describe, expect, test } from "vite-plus/test";
import {
  invalidateMessageQueries,
  type MessageQueryInvalidator,
} from "../src/components/messages/message-realtime.ts";
import { queryKeys } from "../src/api/queries/index.ts";

function createInvalidator() {
  const queryKeysSeen: unknown[] = [];
  const invalidator: MessageQueryInvalidator = {
    invalidateQueries: async (filters) => {
      const resolved = typeof filters === "function" ? filters() : filters;
      queryKeysSeen.push(resolved?.queryKey);
    },
  };
  return { invalidator, queryKeysSeen };
}

describe("实时消息缓存失效", () => {
  test("私信事件刷新会话、未读计数和联系人", async () => {
    const { invalidator, queryKeysSeen } = createInvalidator();
    await invalidateMessageQueries(invalidator, "message");
    expect(queryKeysSeen).toEqual([
      queryKeys.privateConversationRoot,
      queryKeys.unreadCountsRoot,
      queryKeys.privateContactsRoot,
    ]);
  });

  test("通知事件刷新未读计数和通知列表", async () => {
    const { invalidator, queryKeysSeen } = createInvalidator();
    await invalidateMessageQueries(invalidator, "notification");
    expect(queryKeysSeen).toEqual([queryKeys.unreadCountsRoot, queryKeys.notificationsRoot]);
  });
});
