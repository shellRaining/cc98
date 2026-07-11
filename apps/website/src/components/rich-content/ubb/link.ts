import type { UbbTagRenderer } from "./types";
import { h } from "vue";
import { getUbbTextContent } from "../text";
import { sanitizeLinkUrl } from "../security";
import UniverseLink from "../universe/UniverseLink.vue";

function renderFallback(value: string) {
  return value;
}

export const renderUrlTag: UbbTagRenderer = (node, context, renderChildren) => {
  const source = node.attrs.positionals[0] ?? getUbbTextContent(node.children);
  const href = sanitizeLinkUrl(source, context.options);
  if (!href) return renderChildren(node, context);

  const children = renderChildren(node, context);
  return h(UniverseLink, { href }, () => (children.length > 0 ? children : href));
};

export const renderSiteLinkTag: UbbTagRenderer = (node, context, renderChildren) => {
  const content = getUbbTextContent(node.children).trim();
  const value = (node.attrs.positionals[0] ?? content).trim();
  if (!value) return renderChildren(node, context);

  if (node.tag === "pm") {
    return h("span", { class: "text-cc98-primary" }, `@${value}`);
  }

  const route =
    node.tag === "user"
      ? `/user/${encodeURIComponent(value)}`
      : node.tag === "topic"
        ? `/topic/${encodeURIComponent(value)}`
        : node.tag === "board"
          ? `/list/${encodeURIComponent(value)}`
          : null;
  if (!route) return renderFallback(content || value);

  const children = renderChildren(node, context);
  const fallback =
    node.tag === "user" ? `@${value}` : node.tag === "topic" ? `帖子 ${value}` : `板块 ${value}`;
  return h(UniverseLink, { href: route }, () => (children.length > 0 ? children : fallback));
};
