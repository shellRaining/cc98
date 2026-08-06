import type { UbbEmotionDescriptor, UbbEmotionFamily } from "@cc98/ubb";

/**
 * 表情面板的分类配置。表情数据（编号、资源地址、展示名）来自 packages/ubb，
 * 这里只描述 UI 呈现：tab 顺序、tab 文案、格子边长（按各分类图片实际尺寸取）。
 */
interface EmotionGroup {
  family: UbbEmotionFamily;
  label: string;
  cell: string;
}

export const emotionGroups: EmotionGroup[] = [
  { family: "cc98", label: "CC98", cell: "4rem" },
  { family: "ac", label: "AC娘", cell: "4.75rem" },
  { family: "mahjong-animal", label: "麻将 动物", cell: "2.5rem" },
  { family: "mahjong-cartoon", label: "麻将 卡通", cell: "2.5rem" },
  { family: "mahjong-face", label: "麻将 脸", cell: "2.5rem" },
  { family: "tb", label: "贴吧", cell: "3rem" },
  { family: "ms", label: "雀魂", cell: "4rem" },
  { family: "em", label: "经典", cell: "3rem" },
];

/** 表情按钮图标，取自 heroicons:face-smile-solid，风格与 Crepe 内置图标一致。 */
export const emojiButtonIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25m-2.625 6c-.54 0-.828.419-.936.634a1.96 1.96 0 0 0-.189.866c0 .298.059.605.189.866c.108.215.395.634.936.634c.54 0 .828-.419.936-.634c.13-.26.189-.568.189-.866s-.059-.605-.189-.866c-.108-.215-.395-.634-.936-.634m4.314.634c.108-.215.395-.634.936-.634c.54 0 .828.419.936.634c.13.26.189.568.189.866s-.059.605-.189.866c-.108.215-.395.634-.936.634c-.54 0-.828-.419-.936-.634a1.96 1.96 0 0 1-.189-.866c0-.298.059-.605.189-.866m2.023 6.828a.75.75 0 1 0-1.06-1.06a3.75 3.75 0 0 1-5.304 0a.75.75 0 0 0-1.06 1.06a5.25 5.25 0 0 0 7.424 0" clip-rule="evenodd"/></svg>`;

/**
 * 按当前主题解析 AC 娘资源的显示/插入地址：暗色模式使用 ac-dark 目录。
 * 面板展示与编辑器插入共用，保证所见即所得；插入内容即当前主题版本。
 */
export function resolveEmotionDisplaySrc(emotion: UbbEmotionDescriptor, isDark: boolean): string {
  if (emotion.family === "ac" && isDark) {
    return emotion.src.replace("/ac/", "/ac-dark/");
  }
  return emotion.src;
}
