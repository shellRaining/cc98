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
import { defaultUbbRegistry } from "./registry.ts";

/** 默认的 UBB → HTML renderer。 */
export const ubbHtmlRenderer = defaultUbbRegistry.createRenderer<string>({
  text: escapeHtml,
  concat: (parts) => parts.join(""),
  handlers: {
    // 加粗 / 斜体 / 下划线 / 删除线
    b: ({ children }) => `<strong>${children}</strong>`,
    i: ({ children }) => `<em>${children}</em>`,
    u: ({ children }) => `<u>${children}</u>`,
    del: ({ children }) => `<s>${children}</s>`,

    // 样式 span / div
    english: ({ children }) => `<span style="font-family: Arial">${children}</span>`,
    size: ({ attrs, children }) =>
      `<span style="font-size: ${escapeAttr(attrs.positionals[0] ?? "")}pt">${children}</span>`,
    color: ({ attrs, children }) =>
      `<span style="color: ${escapeAttr(attrs.positionals[0] ?? "")}">${children}</span>`,
    font: ({ attrs, children }) =>
      `<span style="font-family: ${escapeAttr(attrs.positionals[0] ?? "")}">${children}</span>`,
    align: ({ attrs, children }) =>
      `<div style="text-align: ${escapeAttr(attrs.positionals[0] ?? "")}">${children}</div>`,
    left: ({ children }) => `<div style="text-align: left">${children}</div>`,
    center: ({ children }) => `<div style="text-align: center">${children}</div>`,
    right: ({ children }) => `<div style="text-align: right">${children}</div>`,
    cursor: ({ attrs, children }) =>
      `<span style="cursor: ${escapeAttr(attrs.positionals[0] ?? "")}">${children}</span>`,

    // 链接 / 图片
    url: ({ attrs, children, text }) => {
      const addr = attrs.positionals[0] ?? text;
      const label = children || escapeHtml(addr);
      return `<a href="${safeUrl(addr)}">${label}</a>`;
    },
    img: ({ attrs, text }) => {
      const alt = attrs.named.title ?? "";
      return `<img src="${safeUrl(text)}" alt="${escapeAttr(alt)}">`;
    },

    // 引用 / 代码 / 分割线
    quote: ({ attrs, children }) => {
      const source = attrs.positionals[0];
      return source
        ? `<blockquote><cite>${escapeHtml(source)}：</cite>${children}</blockquote>`
        : `<blockquote>${children}</blockquote>`;
    },
    quotex: ({ attrs, children }) => {
      const source = attrs.positionals[0];
      return source
        ? `<blockquote><cite>${escapeHtml(source)}：</cite>${children}</blockquote>`
        : `<blockquote>${children}</blockquote>`;
    },
    code: ({ children }) => `<pre><code>${children}</code></pre>`,
    line: () => `<hr>`,

    // 表格
    table: ({ children }) => `<table>${children}</table>`,
    tr: ({ children }) => `<tr>${children}</tr>`,
    td: ({ node, attrs, children }) => tableCellToHtml(node.tag, attrs.positionals, children),
    th: ({ node, attrs, children }) => tableCellToHtml(node.tag, attrs.positionals, children),

    // Text 模式标签（children 已转义）
    md: ({ children }) => `<div class="ubb-md">${children}</div>`,
    noubb: ({ children }) => children,
    math: ({ children }) => `<span class="ubb-math">${children}</span>`,
    m: ({ children }) => `<span class="ubb-math">${children}</span>`,

    // 媒体
    audio: ({ text }) => `<audio src="${safeUrl(text)}" controls></audio>`,
    mp3: ({ text }) => `<audio src="${safeUrl(text)}" controls></audio>`,
    video: ({ text }) => `<video src="${safeUrl(text)}" controls></video>`,
    bili: ({ text }) =>
      `<a href="https://www.bilibili.com/video/${escapeAttr(text)}">bili:${escapeHtml(text)}</a>`,
    upload: ({ text }) => `<a href="${safeUrl(text)}">下载文件</a>`,

    // 站内链接
    user: ({ attrs, text }) => {
      const name = text || attrs.positionals[0] || "";
      return `<a href="/user/${escapeAttr(name)}">@${escapeHtml(name)}</a>`;
    },
    topic: ({ attrs, children }) => {
      const id = attrs.positionals[0] ?? "";
      const title = children || `帖子 ${escapeHtml(id)}`;
      return `<a href="/topic/${escapeAttr(id)}">${title}</a>`;
    },
    board: ({ attrs, children }) => {
      const id = attrs.positionals[0] ?? "";
      const title = children || `板块 ${escapeHtml(id)}`;
      return `<a href="/board/${escapeAttr(id)}">${title}</a>`;
    },
    pm: ({ attrs, text }) => {
      const name = attrs.positionals[0] ?? text;
      return `<span class="ubb-pm">@${escapeHtml(name)}</span>`;
    },

    // 权限标签剥除为空字符串；表情标签由 fallback 以空 children 自然剥除。
    needreply: () => "",
    posteronly: () => "",
    allowviewer: () => "",
  },
  // 其他标签保留已经渲染的 children 内容。
  fallback: ({ children }) => children,
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
