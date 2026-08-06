import { describe, expect, test } from "vite-plus/test";
import {
  listUbbEmotions,
  resolveUbbEmotionTag,
  UBB_EMOTION_FAMILIES,
  ubbEmotionDisplayName,
} from "../src/emotion.ts";

describe("表情表", () => {
  test("各分类的表情数量与 CC98 官方资源范围一致", () => {
    const counts = Object.fromEntries(
      UBB_EMOTION_FAMILIES.map((family) => [family, listUbbEmotions(family).length]),
    );
    expect(counts).toEqual({
      em: 92,
      ac: 149,
      ms: 54,
      cc98: 37,
      tb: 33,
      "mahjong-animal": 16,
      "mahjong-cartoon": 10,
      "mahjong-face": 208,
    });
  });

  test("枚举出的表情与标签解析结果是同一份数据", () => {
    const ac01 = listUbbEmotions("ac")[0];
    expect(ac01).toBe(resolveUbbEmotionTag("ac01"));
    expect(ac01.src).toBe("https://www.cc98.org/static/images/ac/01.png");
    expect(ubbEmotionDisplayName(ac01)).toBe("AC娘 01");

    const cartoon = listUbbEmotions("mahjong-cartoon")[0];
    expect(cartoon).toBe(resolveUbbEmotionTag("c:003"));
    expect(ubbEmotionDisplayName(cartoon)).toBe("麻将脸 卡通 003");
  });

  test("范围外或补零形式的编号不成立", () => {
    expect(resolveUbbEmotionTag("ac00")).toBeNull();
    expect(resolveUbbEmotionTag("ac55")).toBeNull();
    // AC 娘四位编号只有 1001-1040 / 2001-2055，官方没有 0001.png 这类资源
    expect(resolveUbbEmotionTag("ac0001")).toBeNull();
    expect(resolveUbbEmotionTag("em92")).toBeNull();
    expect(resolveUbbEmotionTag("c:020")).toBeNull();
    expect(resolveUbbEmotionTag("f:209")).toBeNull();
    expect(resolveUbbEmotionTag("ac1")).toBeNull();
  });
});
