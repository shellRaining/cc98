import { describe, expect, test } from "vite-plus/test";
import { annualReviewV2Schema } from "@cc98/api";
import {
  annualReviewAchievements,
  annualReviewPages,
  annualReviewWinRate,
  resolveFavoritePostPeriod,
} from "../src/lib/annual-review.ts";

describe("年度总结页面序列", () => {
  test("按抽卡和竞猜数据跳过不存在的页面", () => {
    expect(annualReviewPages({})).toEqual([
      "cover",
      "overview",
      "likes",
      "topics",
      "ratings",
      "boards",
      "time",
      "achievements",
    ]);
    expect(annualReviewPages({ cardDraw: {}, bet: {} })).toEqual([
      "cover",
      "overview",
      "likes",
      "topics",
      "ratings",
      "boards",
      "time",
      "card-draw",
      "bet",
      "achievements",
    ]);
  });
});

describe("年度总结统计", () => {
  test("只在唯一最高时段存在时给出偏好", () => {
    expect(resolveFavoritePostPeriod({ postCount06: 3, postCount612: 9 })).toBe("上午");
    expect(resolveFavoritePostPeriod({ postCount06: 9, postCount612: 9 })).toBeNull();
    expect(resolveFavoritePostPeriod({})).toBeNull();
  });

  test("竞猜胜率处理零场次并保留一位小数", () => {
    expect(annualReviewWinRate({ bet: { totalCount: 3, winCount: 2 } })).toBe("66.7%");
    expect(annualReviewWinRate({ bet: { totalCount: 0, winCount: 0 } })).toBe("0.0%");
  });

  test("成就列表会清理空项", () => {
    expect(annualReviewAchievements(" 年度活跃用户 | | 深夜守望者 ")).toEqual([
      "年度活跃用户",
      "深夜守望者",
    ]);
  });

  test("竞猜响应保留胜负、投注和收益字段", () => {
    const result = annualReviewV2Schema.parse({
      bet: {
        totalCount: 12,
        winCount: 7,
        loseCount: 4,
        drawCount: 1,
        payment: 30000,
        profit: 5200,
      },
    });
    expect(result.bet).toMatchObject({ totalCount: 12, winCount: 7, profit: 5200 });
  });
});
