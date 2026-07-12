import { describe, expect, test } from "vite-plus/test";
import {
  dedupeTopicsById,
  hotTopicsPath,
  isHotPeriod,
  normalizeSearchBoardId,
  normalizeSearchKeyword,
  searchBoardsPath,
  searchTopicsPath,
  userIdPath,
  userNamePath,
} from "../src/lib/discovery.ts";
import { normalizeApiError } from "../src/lib/api-error.ts";
import { queryKeys } from "../src/api/queries/index.ts";

describe("discovery helpers", () => {
  test("规范化搜索关键词与版面 ID", () => {
    expect(normalizeSearchKeyword("  hello  ")).toBe("hello");
    expect(normalizeSearchKeyword("   ")).toBe("");
    expect(normalizeSearchBoardId(undefined)).toBeNull();
    expect(normalizeSearchBoardId("0")).toBeNull();
    expect(normalizeSearchBoardId("758")).toBe(758);
    expect(normalizeSearchBoardId(-1)).toBeNull();
  });

  test("生成发现页路径", () => {
    expect(hotTopicsPath("weekly")).toBe("/topic/hot-weekly");
    expect(searchTopicsPath("vue", null, 1)).toBe("/search?keyword=vue");
    expect(searchTopicsPath("vue", 758, 2)).toBe("/search?keyword=vue&boardId=758&page=2");
    expect(searchTopicsPath("  ", null, 1)).toBe("/search");
    expect(searchBoardsPath("水区")).toBe(`/search/boards?keyword=${encodeURIComponent("水区")}`);
    expect(userIdPath(12)).toBe("/user/id/12");
    expect(userNamePath("alice")).toBe("/user/name/alice");
  });

  test("热门周期校验与主题去重", () => {
    expect(isHotPeriod("monthly")).toBe(true);
    expect(isHotPeriod("daily")).toBe(false);
    expect(
      dedupeTopicsById([
        { id: 1 },
        { id: 2 },
        { id: 1 },
        { id: undefined as unknown as number },
      ]).map((topic) => topic.id),
    ).toEqual([1, 2, undefined]);
  });
});

describe("discovery query keys", () => {
  test("推荐刷新与搜索条件隔离缓存", () => {
    expect(queryKeys.recommendedTopics(10, 1, 3)).not.toEqual(
      queryKeys.recommendedTopics(10, 2, 3),
    );
    expect(queryKeys.searchTopics("a", null, 0, 20, 1)).not.toEqual(
      queryKeys.searchTopics("b", null, 0, 20, 1),
    );
    expect(queryKeys.searchTopics("a", 1, 0, 20, 1)).not.toEqual(
      queryKeys.searchTopics("a", null, 0, 20, 1),
    );
    expect(queryKeys.hotTopics("weekly")).not.toEqual(queryKeys.hotTopics("monthly"));
    expect(queryKeys.userById(1, "anonymous")).not.toEqual(queryKeys.userById(1, 9));
  });
});

describe("search forbidden message", () => {
  test("允许覆盖 403 文案用于搜索限频", () => {
    const error = normalizeApiError(
      { status: 403 },
      { forbiddenMessage: "搜索过于频繁或无权搜索，请稍后再试" },
    );
    expect(error.kind).toBe("forbidden");
    expect(error.message).toContain("过于频繁");
  });
});
