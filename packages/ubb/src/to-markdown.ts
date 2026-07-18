/**
 * UBB → Markdown 导出器。
 *
 * 先用 parseUbb 解析成 AST，再递归遍历 AST 生成 Markdown 字符串。
 *
 * 转换策略：
 * - Markdown 能表达的：b/i/del/url/img/quote/code/line → 对应 Markdown 语法。
 * - Markdown 无法表达的：u/size/color/font/align 等 → 剥除样式保留内容。
 * - 富媒体/站内语义：audio/video/bili → 链接；user/topic/board → @提及/站内链接。
 * - 表情标签：转为 CC98 官方资源的标准 Markdown 图片；权限标签剥除为空字符串。
 * - math/m/noubb/md：保留原文或转义后输出。
 */
import { resolveUbbEmotionTag, type UbbEmotionDescriptor } from "./emotion.ts";
import { parseUbb } from "./parser.ts";
import { getTagMode, matchUbbRegexTagFamily } from "./tags.ts";
import type { UbbNode } from "./types.ts";

/**
 * 把 UBB 文本转成 Markdown 字符串。
 *
 * @param ubb UBB 原始文本。
 * @returns Markdown 字符串。
 */
export function ubbToMarkdown(ubb: string): string {
  const nodes = parseUbb(ubb);
  let result = nodes.map(nodeToMarkdown).join("");

  // [line] 产生的 \n---\n 在字符串首尾时去掉多余换行
  if (result.startsWith("\n---")) result = result.slice(1);
  if (result.endsWith("---\n")) result = result.slice(0, -1);

  return result;
}

/**
 * 递归把单个 AST 节点转成 Markdown。
 */
function nodeToMarkdown(node: UbbNode): string {
  if (node.type === "text") return node.value;

  const { tag, attrs, children } = node;
  const inner = children.map(nodeToMarkdown).join("");

  // 加粗 / 斜体 / 删除线
  if (tag === "b") return `**${inner}**`;
  if (tag === "i") return `_${inner}_`;
  if (tag === "del") return `~~${inner}~~`;

  // 链接
  if (tag === "url") {
    const addr = attrs.positionals[0];
    if (addr) {
      return inner ? `[${inner}](${addr})` : `<${addr}>`;
    }
    return `<${inner}>`;
  }

  // 图片
  if (tag === "img") {
    const alt = attrs.named.title ?? "";
    return `![${alt}](${getTextContent(children)})`;
  }

  // 引用
  if (tag === "quote" || tag === "quotex") {
    const source = attrs.positionals[0];
    const content = source ? `${source}：${inner}` : inner;
    return content
      .split("\n")
      .map((line) => (line.trim() === "" ? ">" : `> ${line}`))
      .join("\n");
  }

  // 代码（单行用行内代码，多行用围栏代码块）
  if (tag === "code") {
    const content = getTextContent(children);
    return content.includes("\n") ? "```\n" + content + "\n```" : "`" + content + "`";
  }

  // 分割线（前后加换行，由 ubbToMarkdown 顶层清理首尾多余换行）
  if (tag === "line") return "\n---\n";

  // Markdown 内容原样输出
  if (tag === "md") return getTextContent(children);

  // noubb 转义方括号
  if (tag === "noubb") {
    return getTextContent(children).replace(/([[\]])/g, "\\$1");
  }

  // 媒体降级为链接
  if (tag === "audio" || tag === "mp3" || tag === "video" || tag === "bili") {
    return `[${tag}](${getTextContent(children)})`;
  }

  // upload 降级为纯地址
  if (tag === "upload") return getTextContent(children);

  // math/m 保留 LaTeX 原文
  if (tag === "math" || tag === "m") return getTextContent(children);

  // 站内链接
  if (tag === "user" || tag === "pm") {
    return `@${attrs.positionals[0] ?? inner}`;
  }
  if (tag === "topic") {
    const id = attrs.positionals[0] ?? "";
    return `[${inner || `帖子 ${id}`}](/topic/${id})`;
  }
  if (tag === "board") {
    const id = attrs.positionals[0] ?? "";
    return `[${inner || `板块 ${id}`}](/board/${id})`;
  }

  // 表格
  if (tag === "table") return tableToMarkdown(children);

  const emotion = resolveUbbEmotionTag(tag);
  if (emotion) return markdownImage(emotionMarkdownAlt(emotion), emotion.src);

  // 能识别标签族但编号无效时保留原始 UBB，避免迁移时静默丢内容
  if (matchUbbRegexTagFamily(tag)) return `[${tag}]`;

  // 权限标签（Empty 模式）剥除为空字符串
  if (getTagMode(tag) === "empty") return "";

  // 其他已知标签（u/size/color/font/align/left/center/right/english/cursor/tr/td/th）：
  // 剥除样式保留内容
  return inner;
}

function markdownImage(alt: string, source: string): string {
  return `![${alt}](${source})`;
}

function emotionMarkdownAlt(emotion: UbbEmotionDescriptor): string {
  switch (emotion.family) {
    case "em":
      return `经典表情 ${emotion.code}`;
    case "ac":
      return `AC娘 ${emotion.code}`;
    case "ms":
      return `雀魂 ${emotion.code}`;
    case "cc98":
      return `CC98 ${emotion.code}`;
    case "tb":
      return `贴吧 ${emotion.code}`;
    case "mahjong-animal":
      return `麻将脸 动物 ${emotion.code}`;
    case "mahjong-cartoon":
      return `麻将脸 卡通 ${emotion.code}`;
    case "mahjong-face":
      return `麻将脸 ${emotion.code}`;
  }
}

/**
 * 把 table 的子节点（tr/td/th）转成 Markdown 表格。
 */
function tableToMarkdown(children: UbbNode[]): string {
  const rows: string[][] = [];

  for (const child of children) {
    if (child.type === "tag" && child.tag === "tr") {
      const cells: string[] = [];
      for (const cell of child.children) {
        if (cell.type === "tag" && (cell.tag === "td" || cell.tag === "th")) {
          cells.push(cell.children.map(nodeToMarkdown).join(""));
        }
      }
      if (cells.length > 0) rows.push(cells);
    }
  }

  if (rows.length === 0) return "";

  const lines: string[] = [];
  // 第一行作表头
  lines.push(`| ${rows[0].join(" | ")} |`);
  // 表头分隔行
  lines.push(`| ${rows[0].map(() => "---").join(" | ")} |`);
  // 数据行
  for (let i = 1; i < rows.length; i++) {
    lines.push(`| ${rows[i].join(" | ")} |`);
  }

  return lines.join("\n");
}

/**
 * 递归提取节点的纯文本内容。
 *
 * 用于 Text 模式标签（code/img/audio 等），其 children 为单个文本节点。
 */
function getTextContent(children: UbbNode[]): string {
  return children
    .map((child) => (child.type === "text" ? child.value : getTextContent(child.children)))
    .join("");
}
