import { resolveUbbEmotionTag } from "@cc98/ubb";
import type { UbbEmotionDescriptor } from "@cc98/ubb";

/**
 * Markdown 编辑器表情面板使用的表情条目。
 * 数据与 packages/ubb 的 resolveUbbEmotionTag 保持一致，src 即官方表情资源地址。
 */
export interface EditorEmotion {
  family: UbbEmotionDescriptor["family"];
  code: string;
  src: string;
  /** 展示名与图片 alt，命名对齐 packages/ubb/src/to-markdown.ts 的 emotionMarkdownAlt。 */
  alt: string;
}

export interface EmotionGroup {
  key: string;
  label: string;
  emotions: EditorEmotion[];
}

const FAMILY_LABELS: Record<UbbEmotionDescriptor["family"], string> = {
  em: "经典表情",
  ac: "AC娘",
  ms: "雀魂",
  cc98: "CC98",
  tb: "贴吧",
  "mahjong-animal": "麻将脸 动物",
  "mahjong-cartoon": "麻将脸 卡通",
  "mahjong-face": "麻将脸",
};

function pad2(value: number): string {
  return value < 10 ? `0${value}` : `${value}`;
}

function pad3(value: number): string {
  return value < 10 ? `00${value}` : value < 100 ? `0${value}` : `${value}`;
}

/** 由 UBB 表情标签构建表情条目，解析失败返回 null。 */
function emotionFromTag(tag: string): EditorEmotion | null {
  const descriptor = resolveUbbEmotionTag(tag);
  if (!descriptor) return null;
  return {
    family: descriptor.family,
    code: descriptor.code,
    src: descriptor.src,
    alt: `${FAMILY_LABELS[descriptor.family]} ${descriptor.code}`,
  };
}

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function collect(tags: string[]): EditorEmotion[] {
  return tags.flatMap((tag) => {
    const emotion = emotionFromTag(tag);
    return emotion ? [emotion] : [];
  });
}

function buildGroup(key: string, label: string, tags: string[]): EmotionGroup {
  return { key, label, emotions: collect(tags) };
}

/** 表情按钮图标，取自 heroicons:face-smile-solid，风格与 Crepe 内置图标一致。 */
export const emojiButtonIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25m-2.625 6c-.54 0-.828.419-.936.634a1.96 1.96 0 0 0-.189.866c0 .298.059.605.189.866c.108.215.395.634.936.634c.54 0 .828-.419.936-.634c.13-.26.189-.568.189-.866s-.059-.605-.189-.866c-.108-.215-.395-.634-.936-.634m4.314.634c.108-.215.395-.634.936-.634c.54 0 .828.419.936.634c.13.26.189.568.189.866s-.059.605-.189.866c-.108.215-.395.634-.936.634c-.54 0-.828-.419-.936-.634a1.96 1.96 0 0 1-.189-.866c0-.298.059-.605.189-.866m2.023 6.828a.75.75 0 1 0-1.06-1.06a3.75 3.75 0 0 1-5.304 0a.75.75 0 0 0-1.06 1.06a5.25 5.25 0 0 0 7.424 0" clip-rule="evenodd"/></svg>`;

/** 表情插入到正文后的 Markdown 形态，与 packages/ubb 的 UBB→Markdown 输出一致。 */
export function emotionToMarkdown(emotion: EditorEmotion): string {
  return `![${emotion.alt}](${emotion.src})`;
}

/**
 * 按当前主题解析 AC 娘资源的显示/插入地址：暗色模式使用 ac-dark 目录。
 * 面板展示与编辑器插入共用，保证所见即所得；插入内容即当前主题版本。
 */
export function resolveEmotionDisplaySrc(emotion: EditorEmotion, isDark: boolean): string {
  if (emotion.family === "ac" && isDark) {
    return emotion.src.replace("/ac/", "/ac-dark/");
  }
  return emotion.src;
}

export const emotionGroups: EmotionGroup[] = [
  buildGroup(
    "cc98",
    "CC98",
    range(1, 37).map((value) => `cc98${pad2(value)}`),
  ),
  buildGroup("ac", "AC娘", [
    ...range(1, 54).map((value) => `ac${pad2(value)}`),
    ...range(1001, 1040).map((value) => `ac${value}`),
    ...range(2001, 2055).map((value) => `ac${value}`),
  ]),
  buildGroup("mahjong", "麻将脸", [
    ...range(1, 16).map((value) => `a:${pad3(value)}`),
    ...[3, 18, 19, 46, 49, 59, 96, 134, 189, 217].map((value) => `c:${pad3(value)}`),
    ...range(1, 208).map((value) => `f:${pad3(value)}`),
  ]),
  buildGroup(
    "tb",
    "贴吧",
    range(1, 33).map((value) => `tb${pad2(value)}`),
  ),
  buildGroup(
    "ms",
    "雀魂",
    range(1, 54).map((value) => `ms${pad2(value)}`),
  ),
  buildGroup(
    "em",
    "经典",
    range(0, 91).map((value) => `em${pad2(value)}`),
  ),
];

/** 麻将脸在面板内按动物/卡通/脸子分区展示时使用。 */
const mahjongEmotions = emotionGroups.find((group) => group.key === "mahjong")!.emotions;
export const mahjongSubgroups: { label: string; emotions: EditorEmotion[] }[] = [
  { label: "动物", emotions: mahjongEmotions.filter((e) => e.family === "mahjong-animal") },
  { label: "卡通", emotions: mahjongEmotions.filter((e) => e.family === "mahjong-cartoon") },
  { label: "脸", emotions: mahjongEmotions.filter((e) => e.family === "mahjong-face") },
];
