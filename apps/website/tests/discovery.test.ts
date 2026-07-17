import { describe, expect, test } from "vite-plus/test";
import {
  dedupeTopicsById,
  focusPath,
  formatDiscoveryDateTime,
  formatDiscoveryTime,
  hotTopicsPath,
  isHotPeriod,
  normalizeSearchBoardId,
  normalizeSearchKeyword,
  newTopicsPath,
  newTopicViewPreference,
  resolveFocusBoardId,
  resolveFocusMode,
  resolveNewTopicViewMode,
  searchBoardsPath,
  searchTopicsPath,
  userIdPath,
  userNamePath,
  uniqueTopicBoardIds,
  uniqueTopicUserIds,
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
    expect(searchTopicsPath("vue")).toBe("/search?boardId=0&keyword=vue");
    expect(searchTopicsPath("vue", 758)).toBe("/search?boardId=758&keyword=vue");
    expect(searchTopicsPath("  ")).toBe("/search");
    expect(searchBoardsPath("水区")).toBe(`/searchBoard?keyword=${encodeURIComponent("水区")}`);
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

  test("解析新帖视图并生成可刷新的路径", () => {
    expect(resolveNewTopicViewMode(undefined, 1)).toBe("card");
    expect(resolveNewTopicViewMode("media", 0)).toBe("media");
    expect(newTopicViewPreference("classic")).toBe(0);
    expect(newTopicViewPreference("card")).toBe(1);
    expect(newTopicsPath("classic")).toBe("/newtopics");
    expect(newTopicsPath("media")).toBe("/newtopics?view=media");
  });

  test("解析关注页状态并生成可刷新的路径", () => {
    expect(resolveFocusMode("user")).toBe("user");
    expect(resolveFocusMode("unknown")).toBe("board");
    expect(resolveFocusBoardId("81")).toBe(81);
    expect(resolveFocusBoardId(["182", "81"])).toBe(182);
    expect(resolveFocusBoardId("0")).toBe(0);
    expect(focusPath("board")).toBe("/focus/board");
    expect(focusPath("board", 81)).toBe("/focus/board?boardId=81");
    expect(focusPath("favorite")).toBe("/focus/favorite");
  });

  test("提取新帖关联实体并格式化相对时间", () => {
    const topics = [
      { boardId: 1, userId: 2 },
      { boardId: 1, userId: 3, isAnonymous: true },
      { boardId: 4, userId: 2 },
    ];
    expect(uniqueTopicBoardIds(topics)).toEqual([1, 4]);
    expect(uniqueTopicUserIds(topics)).toEqual([2]);
    expect(
      formatDiscoveryTime("2026-07-17T11:30:00+08:00", new Date("2026-07-17T12:00:00+08:00")),
    ).toBe("30分钟前");
    expect(formatDiscoveryDateTime("2026-07-17T11:30:45+08:00")).toBe("2026-07-17 11:30:45");
  });
});

describe("discovery query keys", () => {
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
