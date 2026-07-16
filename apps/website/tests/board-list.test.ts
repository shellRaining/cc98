import { describe, expect, it } from "vite-plus/test";
import {
  BOARD_ICON_FALLBACK,
  boardGroupAnchor,
  boardIconUrl,
  isCompactBoardGroup,
} from "../src/lib/board-list.ts";

describe("版面列表工具", () => {
  it("为大量文字版面的分区使用紧凑布局", () => {
    expect(isCompactBoardGroup(2)).toBe(true);
    expect(isCompactBoardGroup(35)).toBe(true);
    expect(isCompactBoardGroup(3)).toBe(false);
  });

  it("生成稳定的分区锚点", () => {
    expect(boardGroupAnchor(24)).toBe("board-group-24");
    expect(boardGroupAnchor(undefined)).toBe("board-group-unknown");
  });

  it("按旧站规则生成版面图标与回退地址", () => {
    expect(boardIconUrl("学习天地")).toBe("/static/images/_学习天地.png");
    expect(boardIconUrl(undefined)).toBe(BOARD_ICON_FALLBACK);
  });
});
