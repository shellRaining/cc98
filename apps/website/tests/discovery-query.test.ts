import { describe, expect, test, vi } from "vite-plus/test";
import { QueryClient } from "@tanstack/vue-query";
import { newTopicsInfiniteQuery } from "../src/api/queries/discovery.ts";
import { typedGet } from "../src/lib/http.ts";
import { queryKeys } from "../src/api/queries/index.ts";
import { normalizeApiError } from "../src/lib/api-error.ts";

vi.mock("../src/lib/http.ts", () => ({ typedGet: vi.fn() }));

describe("最新主题查询", () => {
  test("混合列表中的抽奖主题不会导致整页校验失败", async () => {
    const topics = [
      { id: 1, contentType: 0, mediaContent: null },
      { id: 2, contentType: 4, mediaContent: { thumbnail: ["https://example.com/image.png"] } },
      {
        id: 3,
        contentType: 5,
        mediaContent: null,
        lotteryTopicDetail: {
          drawingTime: "2026-10-07T21:08:00+08:00",
          drawingCount: 666,
          mode: 2,
          status: 1,
          resultFloor: null,
        },
      },
    ];
    vi.mocked(typedGet).mockResolvedValueOnce(topics);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    try {
      const result = await client.fetchInfiniteQuery(newTopicsInfiniteQuery("all", 1));
      expect(result.pages).toEqual([topics]);
      expect(result.pageParams).toEqual([0]);
      expect(typedGet).toHaveBeenCalledWith("/topic/new", { query: { from: 0, size: 20 } });
    } finally {
      client.clear();
    }
  });
});

describe("发现查询缓存键", () => {
  test("推荐刷新与搜索条件隔离缓存", () => {
    expect(queryKeys.recommendedTopics(10, 1, 3)).not.toEqual(
      queryKeys.recommendedTopics(10, 2, 3),
    );
    expect(queryKeys.searchTopics("a", null, 20, 1)).not.toEqual(
      queryKeys.searchTopics("b", null, 20, 1),
    );
    expect(queryKeys.searchTopics("a", 1, 20, 1)).not.toEqual(
      queryKeys.searchTopics("a", null, 20, 1),
    );
    expect(queryKeys.hotTopics("weekly")).not.toEqual(queryKeys.hotTopics("monthly"));
    expect(queryKeys.newTopics("all", 20, 1)).not.toEqual(queryKeys.newTopics("media", 20, 1));
    expect(queryKeys.focusTopics("board", 0, 20, 1)).not.toEqual(
      queryKeys.focusTopics("board", 81, 20, 1),
    );
    expect(queryKeys.focusTopics("board", 0, 20, 1)).not.toEqual(
      queryKeys.focusTopics("user", 0, 20, 1),
    );
    expect(queryKeys.userById(1, "anonymous")).not.toEqual(queryKeys.userById(1, 9));
  });

  test("允许覆盖搜索 403 文案", () => {
    const error = normalizeApiError(
      { status: 403 },
      { forbiddenMessage: "搜索过于频繁或无权搜索，请稍后再试" },
    );
    expect(error.kind).toBe("forbidden");
    expect(error.message).toContain("过于频繁");
  });
});
