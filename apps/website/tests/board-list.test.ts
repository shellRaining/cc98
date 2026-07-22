import { describe, expect, it } from "vite-plus/test";
import { BOARD_ICON_FALLBACK, boardIconUrl } from "../src/components/board/board-icon.ts";
import { boardGroupAnchor, isCompactBoardGroup } from "../src/views/board/list.ts";

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

  it("从构建时注册表解析版面图标并提供回退", () => {
    expect(boardIconUrl("学习天地")).not.toBe(BOARD_ICON_FALLBACK);
    expect(boardIconUrl("似水流年·寒假")).not.toBe(BOARD_ICON_FALLBACK);
    expect(boardIconUrl("不存在的版面")).toBe(BOARD_ICON_FALLBACK);
    expect(boardIconUrl(undefined)).toBe(BOARD_ICON_FALLBACK);
  });
});
