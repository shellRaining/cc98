import { describe, expect, test } from "vite-plus/test";
import { focusPath, resolveFocusBoardId, resolveFocusMode } from "../src/views/discovery/focus.ts";
import { isHotPeriod } from "../src/views/discovery/hot-topics.ts";
import {
  newTopicsPath,
  newTopicViewPreference,
  resolveNewTopicViewMode,
} from "../src/views/discovery/new-topics.ts";
import {
  hotTopicsPath,
  normalizeSearchBoardId,
  normalizeSearchKeyword,
  searchBoardsPath,
  searchTopicsPath,
  userIdPath,
  userNamePath,
} from "../src/router/links.ts";

describe("发现页导航", () => {
  test("规范化搜索关键词与版面 ID", () => {
    expect(normalizeSearchKeyword("  hello  ")).toBe("hello");
    expect(normalizeSearchKeyword("   ")).toBe("");
    expect(normalizeSearchBoardId(undefined)).toBeNull();
    expect(normalizeSearchBoardId("0")).toBeNull();
    expect(normalizeSearchBoardId("758")).toBe(758);
    expect(normalizeSearchBoardId(-1)).toBeNull();
  });

  test("生成发现和用户页面路径", () => {
    expect(hotTopicsPath("weekly")).toBe("/topic/hot-weekly");
    expect(searchTopicsPath("vue")).toBe("/search?boardId=0&keyword=vue");
    expect(searchTopicsPath("vue", 758)).toBe("/search?boardId=758&keyword=vue");
    expect(searchTopicsPath("  ")).toBe("/search");
    expect(searchBoardsPath("水区")).toBe(`/searchBoard?keyword=${encodeURIComponent("水区")}`);
    expect(userIdPath(12)).toBe("/user/id/12");
    expect(userNamePath("alice")).toBe("/user/name/alice");
  });

  test("解析热门和新帖视图", () => {
    expect(isHotPeriod("monthly")).toBe(true);
    expect(isHotPeriod("daily")).toBe(false);
    expect(resolveNewTopicViewMode(undefined, 1)).toBe("card");
    expect(resolveNewTopicViewMode("media", 0)).toBe("media");
    expect(newTopicViewPreference("classic")).toBe(0);
    expect(newTopicViewPreference("card")).toBe(1);
    expect(newTopicsPath("classic")).toBe("/newtopics");
    expect(newTopicsPath("media")).toBe("/newtopics?view=media");
  });

  test("解析关注页状态", () => {
    expect(resolveFocusMode("user")).toBe("user");
    expect(resolveFocusMode("unknown")).toBe("board");
    expect(resolveFocusBoardId("81")).toBe(81);
    expect(resolveFocusBoardId(["182", "81"])).toBe(182);
    expect(resolveFocusBoardId("0")).toBe(0);
    expect(focusPath("board")).toBe("/focus/board");
    expect(focusPath("board", 81)).toBe("/focus/board?boardId=81");
    expect(focusPath("favorite")).toBe("/focus/favorite");
  });
});
