/**
 * UBB → HTML 导出器。
 *
 * 通过默认 UBB 注册表创建字符串 renderer，把 AST 转成净化后的 HTML 字符串。
 *
 * 安全策略：
 * 1. 文本节点转义 HTML 特殊字符（& < > "），防止 XSS。
 * 2. URL 属性值用协议白名单过滤（http/https/mailto/相对路径），
 *    危险协议（javascript:/data:）替换为 #。
 * 3. style/colspan/rowspan 等属性值也转义，防止跳出属性边界。
 */
import { cc98Registry } from "./index.ts";

/** 默认的 UBB → HTML renderer。 */
export const ubbHtmlRenderer = cc98Registry.createRenderer<string>({
  renderText: escapeHtml,
  concat: (parts) => parts.join(""),
  handlers: {
    // 加粗 / 斜体 / 下划线 / 删除线
    b: ({ content }) => `<strong>${content}</strong>`,
    i: ({ content }) => `<em>${content}</em>`,
    u: ({ content }) => `<u>${content}</u>`,
    del: ({ content }) => `<s>${content}</s>`,

    // 样式 span / div
    english: ({ content }) => `<span style="font-family: Arial">${content}</span>`,
    size: ({ attrs, content }) =>
      `<span style="font-size: ${escapeAttr(attrs.positionals[0] ?? "")}pt">${content}</span>`,
    color: ({ attrs, content }) =>
      `<span style="color: ${escapeAttr(attrs.positionals[0] ?? "")}">${content}</span>`,
    font: ({ attrs, content }) =>
      `<span style="font-family: ${escapeAttr(attrs.positionals[0] ?? "")}">${content}</span>`,
    align: ({ attrs, content }) =>
      `<div style="text-align: ${escapeAttr(attrs.positionals[0] ?? "")}">${content}</div>`,
    left: ({ content }) => `<div style="text-align: left">${content}</div>`,
    center: ({ content }) => `<div style="text-align: center">${content}</div>`,
    right: ({ content }) => `<div style="text-align: right">${content}</div>`,
    cursor: ({ attrs, content }) =>
      `<span style="cursor: ${escapeAttr(attrs.positionals[0] ?? "")}">${content}</span>`,

    // 链接 / 图片
    url: ({ attrs, content, textContent }) => {
      const addr = attrs.positionals[0] ?? textContent;
      const label = content || escapeHtml(addr);
      return `<a href="${safeUrl(addr)}">${label}</a>`;
    },
    img: ({ attrs, textContent }) => {
      const alt = attrs.named.title ?? "";
      return `<img src="${safeUrl(textContent)}" alt="${escapeAttr(alt)}">`;
    },

    // 引用 / 代码 / 分割线
    quote: ({ attrs, content }) => {
      const source = attrs.positionals[0];
      return source
        ? `<blockquote><cite>${escapeHtml(source)}：</cite>${content}</blockquote>`
        : `<blockquote>${content}</blockquote>`;
    },
    quotex: ({ attrs, content }) => {
      const source = attrs.positionals[0];
      return source
        ? `<blockquote><cite>${escapeHtml(source)}：</cite>${content}</blockquote>`
        : `<blockquote>${content}</blockquote>`;
    },
    code: ({ content }) => `<pre><code>${content}</code></pre>`,
    line: () => `<hr>`,

    // 表格
    table: ({ content }) => `<table>${content}</table>`,
    tr: ({ content }) => `<tr>${content}</tr>`,
    td: ({ node, attrs, content }) => tableCellToHtml(node.tag, attrs.positionals, content),
    th: ({ node, attrs, content }) => tableCellToHtml(node.tag, attrs.positionals, content),

    // Text 模式标签（content 已转义）
    md: ({ content }) => `<div class="ubb-md">${content}</div>`,
    noubb: ({ content }) => content,
    math: ({ content }) => `<span class="ubb-math">${content}</span>`,
    m: ({ content }) => `<span class="ubb-math">${content}</span>`,

    // 媒体
    audio: ({ textContent }) => `<audio src="${safeUrl(textContent)}" controls></audio>`,
    mp3: ({ textContent }) => `<audio src="${safeUrl(textContent)}" controls></audio>`,
    video: ({ textContent }) => `<video src="${safeUrl(textContent)}" controls></video>`,
    bili: ({ textContent }) =>
      `<a href="https://www.bilibili.com/video/${escapeAttr(textContent)}">bili:${escapeHtml(textContent)}</a>`,
    upload: ({ textContent }) => `<a href="${safeUrl(textContent)}">下载文件</a>`,

    // 站内链接
    user: ({ attrs, textContent }) => {
      const name = textContent || attrs.positionals[0] || "";
      return `<a href="/user/${escapeAttr(name)}">@${escapeHtml(name)}</a>`;
    },
    topic: ({ attrs, content }) => {
      const id = attrs.positionals[0] ?? "";
      const title = content || `帖子 ${escapeHtml(id)}`;
      return `<a href="/topic/${escapeAttr(id)}">${title}</a>`;
    },
    board: ({ attrs, content }) => {
      const id = attrs.positionals[0] ?? "";
      const title = content || `板块 ${escapeHtml(id)}`;
      return `<a href="/board/${escapeAttr(id)}">${title}</a>`;
    },
    pm: ({ attrs, textContent }) => {
      const name = attrs.positionals[0] ?? textContent;
      return `<span class="ubb-pm">@${escapeHtml(name)}</span>`;
    },

    // 权限标签剥除为空字符串；表情标签由 fallback 以空 content 自然剥除。
    needreply: () => "",
    posteronly: () => "",
    allowviewer: () => "",
  },
  // 其他标签保留已经渲染的 content 内容。
  fallback: ({ content }) => content,
});

/**
 * 把 UBB 文本转成净化后的 HTML 字符串。
 *
 * @param ubb UBB 原始文本。
 * @returns HTML 字符串。
 */
export function ubbToHtml(ubb: string): string {
  return ubbHtmlRenderer.render(ubb);
}

function tableCellToHtml(tag: string, positionals: readonly string[], children: string): string {
  const parts: string[] = [];
  if (positionals.length === 2) {
    parts.push(`rowspan="${escapeAttr(positionals[0])}"`);
    parts.push(`colspan="${escapeAttr(positionals[1])}"`);
  }
  const attrStr = parts.length > 0 ? " " + parts.join(" ") : "";
  return `<${tag}${attrStr}>${children}</${tag}>`;
}

/**
 * 转义 HTML 文本节点中的特殊字符。
 *
 * 必须先转义 &，避免 &lt; 中的 & 被二次转义。
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** 转义 HTML 属性值中的特殊字符（与 escapeHtml 相同）。 */
function escapeAttr(text: string): string {
  return escapeHtml(text);
}

/**
 * URL 协议白名单过滤。
 *
 * 只允许 http://、https://、mailto:、/（相对路径）。
 * 不安全协议替换为 #。
 */
function safeUrl(url: string): string {
  if (/^(https?:\/\/|mailto:|\/)/i.test(url)) {
    return escapeAttr(url);
  }
  return "#";
}
