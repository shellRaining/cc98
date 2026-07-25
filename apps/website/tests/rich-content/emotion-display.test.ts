import type { UbbEmotionDescriptor } from "@cc98/ubb";
import { describe, expect, test } from "vite-plus/test";
import { resolveEmotionDisplaySource } from "../../src/components/rich-content/ubb/emotion/source.ts";

const acEmotion: UbbEmotionDescriptor = {
  family: "ac",
  code: "01",
  src: "https://www.cc98.org/static/images/ac/01.png",
  alt: "[ac:01]",
};

describe("表情展示资源", () => {
  test("暗色模式使用 AC 娘深夜表情", () => {
    expect(resolveEmotionDisplaySource(acEmotion, "dark")).toBe(
      "https://www.cc98.org/static/images/ac-dark/01.png",
    );
  });

  test("亮色模式和其他表情保持标准资源", () => {
    expect(resolveEmotionDisplaySource(acEmotion, "light")).toBe(acEmotion.src);

    const cc98Emotion: UbbEmotionDescriptor = {
      ...acEmotion,
      family: "cc98",
      src: "https://www.cc98.org/static/images/CC98/CC9801.gif",
    };
    expect(resolveEmotionDisplaySource(cc98Emotion, "dark")).toBe(cc98Emotion.src);
  });
});
