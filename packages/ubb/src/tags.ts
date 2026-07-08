/**
 * UBB 标签模式表。
 *
 * 移植自 Forum/Ubb/UbbCodeExtension.tsx 的 handler 注册表。
 * 老项目通过 handler 的 getTagMode 返回模式（Recursive/Text/Empty），
 * 新解析器用静态表 + 正则表替代，避免引入 handler 层。
 *
 * 三种模式：
 * - recursive：标签内部允许其它 UBB 标签，递归建树。
 * - text：标签内部只允许纯文字，内容作为单个文本节点（不递归）。
 * - empty：自闭合标签，children 恒为空；紧跟同名结束标签时忽略。
 */

export type TagMode = "recursive" | "text" | "empty" | "autoclose";

/** 静态标签名 → 模式。 */
const staticTags: Record<string, TagMode> = {
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

  // 站内链接（AutoClose：可选结束标签，无结束时自闭合，有结束时包裹内容）
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
};

/** 正则标签名 → 模式。按优先级排序，先匹配先返回。 */
const regexTags: ReadonlyArray<{ pattern: RegExp; mode: TagMode }> = [
  { pattern: /^em\d{2}$/, mode: "empty" },
  { pattern: /^ac(?:\d{2}|\d{4})$/, mode: "empty" },
  { pattern: /^ms\d{2}$/, mode: "empty" },
  { pattern: /^[acf]:\d{3}$/, mode: "empty" },
  { pattern: /^cc98\d{2}$/, mode: "empty" },
  { pattern: /^tb\d{2}$/, mode: "empty" },
];

/**
 * 查询标签的模式。
 *
 * @param tagName 已小写归一化的标签名。
 * @returns 标签模式；未知标签返回 null（主解析器将其降级为文本）。
 */
export function getTagMode(tagName: string): TagMode | null {
  const staticMode = staticTags[tagName];
  if (staticMode) return staticMode;

  for (const { pattern, mode } of regexTags) {
    if (pattern.test(tagName)) return mode;
  }

  return null;
}
