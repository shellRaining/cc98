import { describe, expect, test } from "vite-plus/test";
import { resolveEmotionTag } from "../../src/components/rich-content/ubb/emotion/index.ts";

describe("UBB 表情标签族", () => {
  test.each([
    ["em00", "https://www.cc98.org/static/images/em/em00.gif"],
    ["em91", "https://www.cc98.org/static/images/em/em91.gif"],
    ["ac54", "https://www.cc98.org/static/images/ac/54.png"],
    ["ac1001", "https://www.cc98.org/static/images/ac/1001.png"],
    ["ms01", "https://www.cc98.org/static/images/ms/ms01.png"],
    ["cc9814", "https://www.cc98.org/static/images/CC98/CC9814.gif"],
    ["cc9815", "https://www.cc98.org/static/images/CC98/CC9815.png"],
    ["tb33", "https://www.cc98.org/static/images/tb/tb33.png"],
    ["a:016", "https://www.cc98.org/static/images/mahjong/animal2017/016.png"],
    ["c:018", "https://www.cc98.org/static/images/mahjong/carton2017/018.gif"],
    ["f:004", "https://www.cc98.org/static/images/mahjong/face2017/004.gif"],
    ["f:208", "https://www.cc98.org/static/images/mahjong/face2017/208.png"],
  ])("解析 %s", (tag, src) => {
    expect(resolveEmotionTag(tag)?.src).toBe(src);
  });

  test.each(["em92", "ac00", "ac1041", "ms00", "cc9800", "tb34", "a:017", "c:020", "f:209"])(
    "拒绝非法编号 %s",
    (tag) => {
      expect(resolveEmotionTag(tag)).toBeNull();
    },
  );
});
