import { describe, expect, test } from "vite-plus/test";
import {
  dedupeTopicsById,
  uniqueTopicBoardIds,
  uniqueTopicUserIds,
} from "../src/views/discovery/topics.ts";
import { formatDiscoveryDateTime, formatDiscoveryTime } from "../src/views/discovery/time.ts";

describe("发现主题展示模型", () => {
  test("按主题 ID 去重并保留无 ID 项", () => {
    expect(
      dedupeTopicsById([
        { id: 1 },
        { id: 2 },
        { id: 1 },
        { id: undefined as unknown as number },
      ]).map((topic) => topic.id),
    ).toEqual([1, 2, undefined]);
  });

  test("提取关联实体并格式化时间", () => {
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
