import { listUbbEmotions, resolveUbbEmotionTag, UBB_EMOTION_FAMILIES } from "@cc98/ubb";
import { describe, expect, test } from "vite-plus/test";
import {
  emotionGroups,
  resolveEmotionDisplaySrc,
} from "../src/components/markdown-editor/emoji-data.ts";

describe("表情面板配置", () => {
  test("tab 覆盖 ubb 的全部表情分类，且每个分类都有表情可选", () => {
    expect(emotionGroups.map((group) => group.family).sort()).toEqual(
      [...UBB_EMOTION_FAMILIES].sort(),
    );
    for (const group of emotionGroups) {
      expect(listUbbEmotions(group.family).length, `${group.label} 分类为空`).toBeGreaterThan(0);
    }
  });

  test("AC 娘显示地址随主题切换，其余分类不受影响", () => {
    const ac = resolveUbbEmotionTag("ac01")!;
    const cc98 = resolveUbbEmotionTag("cc9801")!;

    expect(resolveEmotionDisplaySrc(ac, false)).toBe(
      "https://www.cc98.org/static/images/ac/01.png",
    );
    expect(resolveEmotionDisplaySrc(ac, true)).toBe(
      "https://www.cc98.org/static/images/ac-dark/01.png",
    );
    expect(resolveEmotionDisplaySrc(cc98, true)).toBe(
      "https://www.cc98.org/static/images/CC98/CC9801.gif",
    );
  });
});
