import { describe, expect, it } from "vite-plus/test";
import {
  filteredTopicTotalPages,
  resolveTopicPostFilter,
  topicViewQuery,
  uniquePostUserIds,
} from "../src/views/topic/navigation.ts";

describe("主题阅读视图", () => {
  it("追踪楼层优先于只看用户", () => {
    expect(resolveTopicPostFilter({ postId: "20", userId: "30" })).toEqual({
      mode: "trace",
      targetId: 20,
    });
    expect(resolveTopicPostFilter({ userId: "30" })).toEqual({ mode: "user", targetId: 30 });
  });

  it("生成可刷新的过滤查询", () => {
    expect(topicViewQuery("all")).toEqual({});
    expect(topicViewQuery("trace", 20)).toEqual({ postId: "20" });
    expect(topicViewQuery("user", 30)).toEqual({ userId: "30" });
  });

  it("过滤结果按帖子数量分页，不额外计入主楼", () => {
    expect(filteredTopicTotalPages(0)).toBe(1);
    expect(filteredTopicTotalPages(10)).toBe(1);
    expect(filteredTopicTotalPages(11)).toBe(2);
    expect(filteredTopicTotalPages(undefined)).toBeNull();
  });

  it("批量用户查询忽略匿名和重复 ID", () => {
    expect(
      uniquePostUserIds([
        { userId: 1 },
        { userId: 1 },
        { userId: 2, isAnonymous: true },
        { userId: 3 },
      ]),
    ).toEqual([1, 3]);
  });
});
