import { describe, expect, test } from "vite-plus/test";
import { queryKeys } from "../src/api/queries/index.ts";
import { normalizeApiError } from "../src/lib/api-error.ts";

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
