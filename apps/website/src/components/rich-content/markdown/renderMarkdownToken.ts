import type Token from "markdown-it/lib/token.mjs";
import { Fragment, h, type VNodeChild } from "vue";
import { sanitizeImageUrl, sanitizeLinkUrl } from "../security";
import type { RichContentOptions } from "../types";
import UniverseCodeBlock from "../universe/UniverseCodeBlock.vue";
import UniverseImage from "../universe/UniverseImage.vue";
import UniverseLink from "../universe/UniverseLink.vue";
import UniverseQuote from "../universe/UniverseQuote.vue";

function renderInlineTokens(
  tokens: readonly Token[],
  options: Readonly<RichContentOptions>,
): VNodeChild[] {
  return renderMarkdownTokens(tokens, options);
}

function findClosingToken(tokens: readonly Token[], start: number): number {
  const opening = tokens[start];
  let depth = 0;
  for (let index = start + 1; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.type === opening.type) depth += 1;
    if (token.type === opening.type.replace(/_open$/, "_close")) {
      if (depth === 0) return index;
      depth -= 1;
    }
  }
  return tokens.length;
}

function renderContainer(
  token: Token,
  children: VNodeChild[],
  options: Readonly<RichContentOptions>,
): VNodeChild {
  switch (token.type) {
    case "paragraph_open":
      return h("p", { class: "my-2" }, children);
    case "strong_open":
      return h("strong", children);
    case "em_open":
      return h("em", children);
    case "s_open":
      return h("s", children);
    case "blockquote_open":
      return h(UniverseQuote, null, () => children);
    case "bullet_list_open":
      return h("ul", { class: "my-2 list-disc pl-6" }, children);
    case "ordered_list_open":
      return h("ol", { class: "my-2 list-decimal pl-6", start: token.attrGet("start") }, children);
    case "list_item_open":
      return h("li", children);
    case "table_open":
      return h("div", { class: "my-3 overflow-x-auto" }, [
        h("table", { class: "w-full border-collapse text-left" }, children),
      ]);
    case "thead_open":
      return h("thead", children);
    case "tbody_open":
      return h("tbody", children);
    case "tr_open":
      return h("tr", children);
    case "th_open":
      return h("th", { class: "border border-cc98-border px-3 py-2" }, children);
    case "td_open":
      return h("td", { class: "border border-cc98-border px-3 py-2" }, children);
    case "link_open": {
      const source = token.attrGet("href") ?? "";
      const href = sanitizeLinkUrl(source, options);
      return href
        ? h(UniverseLink, { href, title: token.attrGet("title") ?? undefined }, () => children)
        : h(Fragment, children);
    }
    default: {
      const heading = token.type.match(/^heading_open$/) ? Number(token.tag.slice(1)) : null;
      if (heading && heading >= 1 && heading <= 6) {
        return h(token.tag, { class: "mb-2 mt-5 font-bold" }, children);
      }
      return token.tag ? h(token.tag, null, children) : h(Fragment, null, children);
    }
  }
}

function renderSingleToken(token: Token, options: Readonly<RichContentOptions>): VNodeChild {
  switch (token.type) {
    case "text":
      return token.content;
    case "inline":
      return renderInlineTokens(token.children ?? [], options);
    case "softbreak":
      return "\n";
    case "hardbreak":
      return h("br");
    case "code_inline":
      return h(
        "code",
        { class: "rounded bg-cc98-bg-elevated px-1 py-0.5 font-mono text-sm" },
        token.content,
      );
    case "fence":
    case "code_block":
      return h(UniverseCodeBlock, {
        code: token.content.replace(/\n$/, ""),
        language: token.info.trim().split(/\s+/)[0] || undefined,
      });
    case "hr":
      return h("hr", { class: "my-4 border-0 border-t border-cc98-border" });
    case "image": {
      const source = token.attrGet("src") ?? "";
      const src = sanitizeImageUrl(source, options);
      if (!src) return token.content || source;
      return h(UniverseImage, {
        src,
        alt: token.content,
        title: token.attrGet("title") ?? undefined,
        defaultVisible: true,
        allowToolbox: false,
        showCaption: Boolean(token.attrGet("title")),
      });
    }
    case "html_inline":
    case "html_block":
      return token.content;
    default:
      return token.content || "";
  }
}

export function renderMarkdownTokens(
  tokens: readonly Token[],
  options: Readonly<RichContentOptions>,
): VNodeChild[] {
  const result: VNodeChild[] = [];

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.nesting === 1) {
      const closingIndex = findClosingToken(tokens, index);
      const children = renderMarkdownTokens(tokens.slice(index + 1, closingIndex), options);
      result.push(renderContainer(token, children, options));
      index = closingIndex;
      continue;
    }
    if (token.nesting === -1) continue;
    result.push(renderSingleToken(token, options));
  }

  return result;
}
