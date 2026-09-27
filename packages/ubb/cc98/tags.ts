/**
 * UBB 标签模式表。
 *
 * 移植自 Forum/Ubb/UbbCodeExtension.tsx 的 handler 注册表。
 * 老项目通过 handler 的 getTagMode 返回模式（Recursive/Text/Empty），
 * 新解析器用静态表 + 标签族表替代，避免引入 handler 层。
 *
 * 四种模式：
 * - recursive：标签内部允许其它 UBB 标签，递归建树。
 * - text：标签内部只允许纯文字，内容作为单个文本节点（不递归）。
 * - empty：自闭合标签，children 恒为空；紧跟同名结束标签时忽略。
 * - autoclose：可选结束标签。CC98 实际用法中 user/topic/board/pm 常不写
 *   结束标签（`[user=张三]`），故解析阶段按 recursive 处理允许包裹内容；
 *   forceClose 时若仍未关闭，不像 recursive 那样把 startTagString 降级为
 *   文本（那会丢掉站内链接语义），而是保留为空标签节点、子段提升到父级。
 *   与 empty 的区别：empty 永远无 children，autoclose 只在未关闭时才无。
 */

import type { UbbTagMode } from "../src/parser.ts";
import type { UbbTagFamily } from "../src/registry.ts";

/** 静态标签名 → 模式。 */
export const UBB_STATIC_TAG_MODES = {
  // 文字样式（Recursive）
  b: "recursive",
  i: "recursive",
  u: "recursive",
  del: "recursive",
  english: "recursive",
  left: "recursive",
  center: "recursive",
  right: "recursive",
  size: "recursive",
  color: "recursive",
  font: "recursive",
  align: "recursive",
  cursor: "recursive",

  // 链接（Recursive）
  url: "recursive",

  // 表格（Recursive）
  table: "recursive",
  tr: "recursive",
  td: "recursive",
  th: "recursive",

  // 引用（Recursive）
  quote: "recursive",
  quotex: "recursive",

  // 站内链接（AutoClose，模式说明见文件顶部）
  user: "autoclose",
  topic: "autoclose",
  board: "autoclose",
  pm: "autoclose",

  // 文本模式（内部不递归）
  code: "text",
  md: "text",
  noubb: "text",
  img: "text",
  audio: "text",
  mp3: "text",
  video: "text",
  upload: "text",
  bili: "text",
  math: "text",
  m: "text",

  // 自闭合（Empty）
  line: "empty",
  needreply: "empty",
  posteronly: "empty",
  allowviewer: "empty",
} as const satisfies Record<string, UbbTagMode>;

export type UbbStaticTagName = keyof typeof UBB_STATIC_TAG_MODES;

export const UBB_STATIC_TAG_NAMES = Object.freeze(
  Object.keys(UBB_STATIC_TAG_MODES) as UbbStaticTagName[],
);

/** 表情标签族。按声明顺序匹配，编号是否有对应资源由 emotion.ts 判断。 */
export const UBB_TAG_FAMILIES = {
  em: { pattern: /^em\d{2}$/, mode: "empty" },
  ac: { pattern: /^ac(?:\d{2}|\d{4})$/, mode: "empty" },
  ms: { pattern: /^ms\d{2}$/, mode: "empty" },
  mahjong: { pattern: /^[acf]:\d{3}$/, mode: "empty" },
  cc98: { pattern: /^cc98\d{2}$/, mode: "empty" },
  tb: { pattern: /^tb\d{2}$/, mode: "empty" },
} as const satisfies Record<string, UbbTagFamily>;

export type UbbTagFamilyName = keyof typeof UBB_TAG_FAMILIES;

export const UBB_TAG_FAMILY_NAMES = Object.freeze(
  Object.keys(UBB_TAG_FAMILIES) as UbbTagFamilyName[],
);
