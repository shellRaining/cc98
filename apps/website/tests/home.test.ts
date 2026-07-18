import { describe, expect, it } from "vite-plus/test";
import {
  isExternalHomepageUrl,
  normalizeHomepageAssetUrl,
  normalizeHomepageTopic,
  visibleHomepageColumns,
} from "../src/components/home/model.ts";

describe("首页数据辅助函数", () => {
  it("把远程图片升级为 HTTPS", () => {
    expect(normalizeHomepageAssetUrl("http://file.cc98.org/a.png")).toBe(
      "https://file.cc98.org/a.png",
    );
    expect(normalizeHomepageAssetUrl("/static/a.png")).toBe("/static/a.png");
    expect(normalizeHomepageAssetUrl(null)).toBeNull();
  });

  it("过滤停用和过期栏目并按权重排序", () => {
    const result = visibleHomepageColumns(
      [
        { id: 1, enable: true, orderWeight: 1 },
        { id: 2, enable: false, orderWeight: 100 },
        { id: 3, enable: true, orderWeight: 2, expiredTime: "2026-07-16T00:00:00Z" },
        { id: 4, enable: true, orderWeight: 3, expiredTime: "2026-07-18T00:00:00Z" },
      ],
      new Date("2026-07-17T00:00:00Z"),
    );
    expect(result.map((item) => item.id)).toEqual([4, 1]);
  });

  it("区分站内地址和外链", () => {
    expect(isExternalHomepageUrl("https://gaming.cc98.org")).toBe(true);
    expect(isExternalHomepageUrl("/topic/1")).toBe(false);
  });

  it("规范化首页主题并过滤无 ID 数据", () => {
    expect(normalizeHomepageTopic({ id: 1, title: "  测试  ", boardName: "水区" })).toEqual({
      id: 1,
      title: "测试",
      boardId: undefined,
      boardName: "水区",
    });
    expect(normalizeHomepageTopic({ title: "缺少 ID" })).toBeNull();
  });
});
