/**
 * UBB → HTML 导出器。
 *
 * 先用 parseUbb 解析成 AST，再递归遍历 AST 生成净化后的 HTML 字符串。
 *
 * 安全策略：
 * 1. 文本节点转义 HTML 特殊字符（& < > "），防止 XSS。
 * 2. URL 属性值用协议白名单过滤（http/https/mailto/相对路径），
 *    危险协议（javascript:/data:）替换为 #。
 * 3. style/colspan/rowspan 等属性值也转义，防止跳出属性边界。
 */
import type { UbbNode } from "./types.ts";
import { parseUbb } from "./parser.ts";
import { getTagMode } from "./tags.ts";

/**
 * 把 UBB 文本转成净化后的 HTML 字符串。
 *
 * @param ubb UBB 原始文本。
 * @returns HTML 字符串。
 */
export function ubbToHtml(ubb: string): string {
  const nodes = parseUbb(ubb);
  return nodes.map(nodeToHtml).join("");
}

/**
 * 递归把单个 AST 节点转成 HTML。
 */
function nodeToHtml(node: UbbNode): string {
  if (node.type === "text") return escapeHtml(node.value);

  const { tag, attrs, children } = node;
  const inner = children.map(nodeToHtml).join("");

  // 加粗 / 斜体 / 下划线 / 删除线
  if (tag === "b") return `<strong>${inner}</strong>`;
  if (tag === "i") return `<em>${inner}</em>`;
  if (tag === "u") return `<u>${inner}</u>`;
  if (tag === "del") return `<s>${inner}</s>`;

  // 样式 span / div
  if (tag === "english") return `<span style="font-family: Arial">${inner}</span>`;
  if (tag === "size") {
    return `<span style="font-size: ${escapeAttr(attrs.positionals[0] ?? "")}pt">${inner}</span>`;
  }
  if (tag === "color") {
    return `<span style="color: ${escapeAttr(attrs.positionals[0] ?? "")}">${inner}</span>`;
  }
  if (tag === "font") {
    return `<span style="font-family: ${escapeAttr(attrs.positionals[0] ?? "")}">${inner}</span>`;
  }
  if (tag === "align") {
    return `<div style="text-align: ${escapeAttr(attrs.positionals[0] ?? "")}">${inner}</div>`;
  }
  if (tag === "left") return `<div style="text-align: left">${inner}</div>`;
  if (tag === "center") return `<div style="text-align: center">${inner}</div>`;
  if (tag === "right") return `<div style="text-align: right">${inner}</div>`;
  if (tag === "cursor") {
    return `<span style="cursor: ${escapeAttr(attrs.positionals[0] ?? "")}">${inner}</span>`;
  }

  // 链接
  if (tag === "url") {
    const addr = attrs.positionals[0] ?? getTextContent(children);
    const text = inner || escapeHtml(addr);
    return `<a href="${safeUrl(addr)}">${text}</a>`;
  }

  // 图片
  if (tag === "img") {
    const alt = attrs.named.title ?? "";
    const addr = getTextContent(children);
    return `<img src="${safeUrl(addr)}" alt="${escapeAttr(alt)}">`;
  }

  // 引用
  if (tag === "quote" || tag === "quotex") {
    const source = attrs.positionals[0];
    if (source) {
      return `<blockquote><cite>${escapeHtml(source)}：</cite>${inner}</blockquote>`;
    }
    return `<blockquote>${inner}</blockquote>`;
  }

  // 代码（Text 模式，inner 已转义）
  if (tag === "code") return `<pre><code>${inner}</code></pre>`;

  // 分割线
  if (tag === "line") return `<hr>`;

  // 表格
  if (tag === "table") return `<table>${inner}</table>`;
  if (tag === "tr") return `<tr>${inner}</tr>`;
  if (tag === "td" || tag === "th") {
    const parts: string[] = [];
    if (attrs.positionals[0]) parts.push(`colspan="${escapeAttr(attrs.positionals[0])}"`);
    if (attrs.positionals[1]) parts.push(`rowspan="${escapeAttr(attrs.positionals[1])}"`);
    const attrStr = parts.length > 0 ? " " + parts.join(" ") : "";
    return `<${tag}${attrStr}>${inner}</${tag}>`;
  }

  // Text 模式标签（inner 已转义）
  if (tag === "md") return `<div class="ubb-md">${inner}</div>`;
  if (tag === "noubb") return inner;
  if (tag === "math" || tag === "m") return `<span class="ubb-math">${inner}</span>`;

  // 媒体
  if (tag === "audio" || tag === "mp3") {
    return `<audio src="${safeUrl(getTextContent(children))}" controls></audio>`;
  }
  if (tag === "video") {
    return `<video src="${safeUrl(getTextContent(children))}" controls></video>`;
  }
  if (tag === "bili") {
    const id = getTextContent(children);
    return `<a href="https://www.bilibili.com/video/${escapeAttr(id)}">bili:${escapeHtml(id)}</a>`;
  }
  if (tag === "upload") {
    return `<a href="${safeUrl(getTextContent(children))}">下载文件</a>`;
  }

  // 站内链接
  if (tag === "user") {
    const name = attrs.positionals[0] ?? getTextContent(children);
    return `<a href="/user/${escapeAttr(name)}">@${escapeHtml(name)}</a>`;
  }
  if (tag === "topic") {
    const id = attrs.positionals[0] ?? "";
    const title = inner || `帖子 ${escapeHtml(id)}`;
    return `<a href="/topic/${escapeAttr(id)}">${title}</a>`;
  }
  if (tag === "board") {
    const id = attrs.positionals[0] ?? "";
    const title = inner || `板块 ${escapeHtml(id)}`;
    return `<a href="/board/${escapeAttr(id)}">${title}</a>`;
  }
  if (tag === "pm") {
    const name = attrs.positionals[0] ?? getTextContent(children);
    return `<span class="ubb-pm">@${escapeHtml(name)}</span>`;
  }

  // 表情 / 权限标签（Empty 模式）剥除为空字符串
  if (getTagMode(tag) === "empty") return "";

  // 其他未知标签：保留 children 内容
  return inner;
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

/**
 * 转义 HTML 属性值中的特殊字符（与 escapeHtml 相同）。
 */
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

/**
 * 递归提取节点的纯文本内容。
 */
function getTextContent(children: UbbNode[]): string {
  return children
    .map((child) => (child.type === "text" ? child.value : getTextContent(child.children)))
    .join("");
}
