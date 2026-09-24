/**
 * UBB → Markdown 导出器。
 *
 * 通过默认 UBB 注册表创建字符串 renderer。Markdown 能表达的标签转成对应语法，
 * 样式标签保留内容，富媒体降级为链接，权限标签剥除。
 */
import {
  resolveUbbEmotionTag,
  ubbEmotionDisplayName,
  cc98Registry,
  matchUbbRegexTagFamily,
} from "../cc98/index.ts";
import type { UbbNode } from "../src/types.ts";

/** 默认的 UBB → Markdown renderer。 */
export const ubbMarkdownRenderer = cc98Registry.createRenderer<string>({
  text: (value) => value,
  concat: (parts) => parts.join(""),
  handlers: {
    // 文字样式
    b: ({ children }) => `**${children}**`,
    i: ({ children }) => `_${children}_`,
    u: ({ children }) => children,
    del: ({ children }) => `~~${children}~~`,
    english: ({ children }) => children,
    left: ({ children }) => children,
    center: ({ children }) => children,
    right: ({ children }) => children,
    size: ({ children }) => children,
    color: ({ children }) => children,
    font: ({ children }) => children,
    align: ({ children }) => children,
    cursor: ({ children }) => children,

    // 链接 / 图片
    url: ({ attrs, children }) => {
      const address = attrs.positionals[0];
      if (address) return children ? `[${children}](${address})` : `<${address}>`;
      return `<${children}>`;
    },
    img: ({ attrs, text }) => markdownImage(attrs.named.title ?? "", text),

    // 引用 / 代码 / 分割线
    quote: ({ attrs, children }) => quoteToMarkdown(attrs.positionals[0], children),
    quotex: ({ attrs, children }) => quoteToMarkdown(attrs.positionals[0], children),
    code: ({ text }) => (text.includes("\n") ? "```\n" + text + "\n```" : "`" + text + "`"),
    line: () => "\n---\n",

    // 表格由 table handler 统一处理，结构标签在其他位置保留内容。
    table: ({ node, render }) => tableToMarkdown(node.children, render),
    tr: ({ children }) => children,
    td: ({ children }) => children,
    th: ({ children }) => children,

    // Text 模式标签
    md: ({ text }) => text,
    noubb: ({ text }) => text.replace(/([[\]])/g, "\\$1"),
    math: ({ text }) => text,
    m: ({ text }) => text,

    // 媒体
    audio: ({ node, text }) => `[${node.tag}](${text})`,
    mp3: ({ node, text }) => `[${node.tag}](${text})`,
    video: ({ node, text }) => `[${node.tag}](${text})`,
    bili: ({ node, text }) => `[${node.tag}](${text})`,
    upload: ({ text }) => text,

    // 站内链接
    user: ({ attrs, children }) => `@${attrs.positionals[0] ?? children}`,
    pm: ({ attrs, children }) => `@${attrs.positionals[0] ?? children}`,
    topic: ({ attrs, children }) => {
      const id = attrs.positionals[0] ?? "";
      return `[${children || `帖子 ${id}`}](/topic/${id})`;
    },
    board: ({ attrs, children }) => {
      const id = attrs.positionals[0] ?? "";
      return `[${children || `板块 ${id}`}](/board/${id})`;
    },

    // 权限标签
    needreply: () => "",
    posteronly: () => "",
    allowviewer: () => "",
  },
  fallback: ({ node, children }) => {
    const emotion = resolveUbbEmotionTag(node.tag);
    if (emotion) return markdownImage(ubbEmotionDisplayName(emotion), emotion.src);

    // 标签族已识别但编号无效时保留原始 UBB，避免静默丢内容。
    if (matchUbbRegexTagFamily(node.tag)) return `[${node.tag}]`;
    return children;
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
