import { resolveUbbEmotionTag } from "@cc98/ubb";
import { describe, expect, test } from "vite-plus/test";
import {
  emotionGroups,
  emotionToMarkdown,
  mahjongSubgroups,
  resolveEmotionDisplaySrc,
  type EditorEmotion,
} from "../src/components/markdown-editor/emoji-data.ts";

/** 把表情条目还原为对应的 UBB 标签，用于与 resolveUbbEmotionTag 对照。 */
function emotionToTag(emotion: EditorEmotion): string {
  switch (emotion.family) {
    case "mahjong-animal":
      return `a:${emotion.code}`;
    case "mahjong-cartoon":
      return `c:${emotion.code}`;
    case "mahjong-face":
      return `f:${emotion.code}`;
    default:
      return `${emotion.family}${emotion.code}`;
  }
}

describe("表情面板数据", () => {
  test("分组与数量符合 resolveUbbEmotionTag 的合法范围", () => {
    const counts = Object.fromEntries(
      emotionGroups.map((group) => [group.key, group.emotions.length]),
    );
    expect(counts).toEqual({
      cc98: 37,
      ac: 149,
      mahjong: 234,
      tb: 33,
      ms: 54,
      em: 92,
    });
    expect(mahjongSubgroups.map((group) => group.emotions.length)).toEqual([16, 10, 208]);
  });

  test("每个表情都能被 resolveUbbEmotionTag 解析且资源地址一致", () => {
    for (const group of emotionGroups) {
      for (const emotion of group.emotions) {
        const descriptor = resolveUbbEmotionTag(emotionToTag(emotion));
        expect(descriptor, `${emotionToTag(emotion)} 应能被解析`).not.toBeNull();
        expect(descriptor!.src).toBe(emotion.src);
      }
    }
  });

  test("展示名与 UBB→Markdown 迁移输出一致", () => {
    const byFamily = (family: EditorEmotion["family"]) =>
      emotionGroups
        .flatMap((group) => group.emotions)
        .find((emotion) => emotion.family === family)!;

    expect(byFamily("cc98").alt).toBe("CC98 01");
    expect(byFamily("ac").alt).toBe("AC娘 01");
    expect(byFamily("ms").alt).toBe("雀魂 01");
    expect(byFamily("tb").alt).toBe("贴吧 01");
    expect(byFamily("em").alt).toBe("经典表情 00");
    expect(byFamily("mahjong-animal").alt).toBe("麻将脸 动物 001");
    expect(byFamily("mahjong-cartoon").alt).toBe("麻将脸 卡通 003");
    expect(byFamily("mahjong-face").alt).toBe("麻将脸 001");
  });

  test("插入后的 Markdown 为标准图片语法", () => {
    const cc98 = emotionGroups.find((group) => group.key === "cc98")!.emotions[0];
    expect(emotionToMarkdown(cc98)).toBe(
      "![CC98 01](https://www.cc98.org/static/images/CC98/CC9801.gif)",
    );

    const ac = emotionGroups.find((group) => group.key === "ac")!.emotions[0];
    expect(emotionToMarkdown(ac)).toBe("![AC娘 01](https://www.cc98.org/static/images/ac/01.png)");
  });

  test("AC 娘显示地址按主题切换，其余表情不受影响", () => {
    const ac = emotionGroups.find((group) => group.key === "ac")!.emotions[0];
    const cc98 = emotionGroups.find((group) => group.key === "cc98")!.emotions[0];

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
