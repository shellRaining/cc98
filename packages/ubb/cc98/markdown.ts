/**
 * UBB → Markdown 导出器。
 *
 * 通过默认 UBB 注册表创建字符串 renderer。Markdown 能表达的标签转成对应语法，
 * 样式标签保留内容，富媒体降级为链接，权限标签剥除。
 */
import { resolveUbbEmotionTag, ubbEmotionDisplayName, cc98Registry } from "./index.ts";
import type { UbbTagHandler } from "../src/renderer.ts";
import type { UbbNode } from "../src/types.ts";

// 标签族已识别但编号无效时保留原始 UBB，避免静默丢内容。
const emotionToMarkdown: UbbTagHandler<string> = ({ node }) => {
  const emotion = resolveUbbEmotionTag(node.tag);
  return emotion
    ? markdownImage(ubbEmotionDisplayName(emotion), emotion.src)
    : node.raw.open + (node.raw.close ?? "");
};

/** 默认的 UBB → Markdown renderer。 */
export const ubbMarkdownRenderer = cc98Registry.createRenderer<string>({
  renderText: (value) => value,
  concat: (parts) => parts.join(""),
  handlers: {
    // 文字样式
    b: ({ content }) => `**${content}**`,
    i: ({ content }) => `_${content}_`,
    u: ({ content }) => content,
    del: ({ content }) => `~~${content}~~`,
    english: ({ content }) => content,
    left: ({ content }) => content,
    center: ({ content }) => content,
    right: ({ content }) => content,
    size: ({ content }) => content,
    color: ({ content }) => content,
    font: ({ content }) => content,
    align: ({ content }) => content,
    cursor: ({ content }) => content,

    // 链接 / 图片
    url: ({ attrs, content }) => {
      const address = attrs.positionals[0];
      if (address) return content ? `[${content}](${address})` : `<${address}>`;
      return `<${content}>`;
    },
    img: ({ attrs, textContent }) => markdownImage(attrs.named.title ?? "", textContent),

    // 引用 / 代码 / 分割线
    quote: ({ attrs, content }) => quoteToMarkdown(attrs.positionals[0], content),
    quotex: ({ attrs, content }) => quoteToMarkdown(attrs.positionals[0], content),
    code: ({ textContent }) =>
      textContent.includes("\n") ? "```\n" + textContent + "\n```" : "`" + textContent + "`",
    line: () => "\n---\n",

    // 表格由 table handler 统一处理，结构标签在其他位置保留内容。
    table: ({ node, renderNodes }) => tableToMarkdown(node.children, renderNodes),
    tr: ({ content }) => content,
    td: ({ content }) => content,
    th: ({ content }) => content,

    // Text 模式标签
    md: ({ textContent }) => textContent,
    noubb: ({ textContent }) => textContent.replace(/([[\]])/g, "\\$1"),
    math: ({ textContent }) => textContent,
    m: ({ textContent }) => textContent,

    // 媒体
    audio: ({ node, textContent }) => `[${node.tag}](${textContent})`,
    mp3: ({ node, textContent }) => `[${node.tag}](${textContent})`,
    video: ({ node, textContent }) => `[${node.tag}](${textContent})`,
    bili: ({ node, textContent }) => `[${node.tag}](${textContent})`,
    upload: ({ textContent }) => textContent,

    // 站内链接
    user: ({ attrs, content }) => `@${attrs.positionals[0] ?? content}`,
    pm: ({ attrs, content }) => `@${attrs.positionals[0] ?? content}`,
    topic: ({ attrs, content }) => {
      const id = attrs.positionals[0] ?? "";
      return `[${content || `帖子 ${id}`}](/topic/${id})`;
    },
    board: ({ attrs, content }) => {
      const id = attrs.positionals[0] ?? "";
      return `[${content || `板块 ${id}`}](/board/${id})`;
    },

    // 权限标签
    needreply: () => "",
    posteronly: () => "",
    allowviewer: () => "",

    // 表情
    em: emotionToMarkdown,
    ac: emotionToMarkdown,
    ms: emotionToMarkdown,
    mahjong: emotionToMarkdown,
    cc98: emotionToMarkdown,
    tb: emotionToMarkdown,
  },
  finalize: (result) => {
    let output = result;
    if (output.startsWith("\n---")) output = output.slice(1);
    if (output.endsWith("---\n")) output = output.slice(0, -1);
    return output;
  },
});

/** 把 UBB 文本转成 Markdown 字符串。 */
export function ubbToMarkdown(ubb: string): string {
  return ubbMarkdownRenderer.render(ubb);
}

function quoteToMarkdown(source: string | undefined, children: string): string {
  const content = source ? `${source}：${children}` : children;
  return content
    .split("\n")
    .map((line) => (line.trim() === "" ? ">" : `> ${line}`))
    .join("\n");
}

function tableToMarkdown(
  children: readonly UbbNode[],
  render: (nodes: readonly UbbNode[]) => string,
): string {
  const rows: string[][] = [];

  for (const child of children) {
    if (child.type !== "tag" || child.tag !== "tr") continue;

    const cells: string[] = [];
    for (const cell of child.children) {
      if (cell.type === "tag" && (cell.tag === "td" || cell.tag === "th")) {
        cells.push(render(cell.children));
      }
    }
    if (cells.length > 0) rows.push(cells);
  }

  if (rows.length === 0) return "";

  return [
    `| ${rows[0].join(" | ")} |`,
    `| ${rows[0].map(() => "---").join(" | ")} |`,
    ...rows.slice(1).map((row) => `| ${row.join(" | ")} |`),
  ].join("\n");
}

function markdownImage(alt: string, source: string): string {
  return `![${alt}](${source})`;
}
