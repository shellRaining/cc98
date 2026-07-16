import { describe, expect, it } from "vite-plus/test";
import {
  boardViewPath,
  resolveBoardTag,
  resolveBoardViewMode,
  resolveBoardViewPage,
} from "../src/lib/board-view.ts";

describe("版面页路由", () => {
  it("兼容旧的纯数字页码和新的筛选段", () => {
    expect(resolveBoardViewMode("2")).toBe("all");
    expect(resolveBoardViewPage("2", undefined)).toBe(2);
    expect(resolveBoardViewMode("best")).toBe("best");
    expect(resolveBoardViewPage("best", "3")).toBe(3);
  });

  it("生成全部、精华和标签路径", () => {
    expect(boardViewPath(81, "all", 1)).toBe("/list/81");
    expect(boardViewPath(81, "best", 2)).toBe("/list/81/best/2");
    expect(boardViewPath(81, "tag", 1, { tag1: 3, tag2: 8 })).toBe("/list/81/tag?tag1=3&tag2=8");
  });

  it("只接受正整数标签", () => {
    expect(resolveBoardTag("7")).toBe(7);
    expect(resolveBoardTag("bad")).toBeUndefined();
  });
});
