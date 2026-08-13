import { h } from "vue";
import { sanitizeLinkUrl } from "../security";
import UniverseLink from "../universe/UniverseLink.vue";
import type { UbbTagRenderer } from "./types";

export const renderUrlTag: UbbTagRenderer = ({ attrs, text, children, context }) => {
  const source = attrs.positionals[0] ?? text;
  const href = sanitizeLinkUrl(source, context.options);
  if (!href) return children;

  return [h(UniverseLink, { href }, () => (children.length > 0 ? children : href))];
};

export const renderSiteLinkTag: UbbTagRenderer = ({ node, attrs, text, children }) => {
  const content = text.trim();
  const value = (attrs.positionals[0] ?? content).trim();
  if (!value) return children;

  if (node.tag === "pm") {
    return [h("span", { class: "text-cc98-primary" }, `@${value}`)];
  }

  const route =
    node.tag === "user"
      ? `/user/${encodeURIComponent(value)}`
      : node.tag === "topic"
        ? `/topic/${encodeURIComponent(value)}`
        : node.tag === "board"
          ? `/list/${encodeURIComponent(value)}`
          : null;
  if (!route) return [content || value];

  const fallback =
    node.tag === "user" ? `@${value}` : node.tag === "topic" ? `帖子 ${value}` : `板块 ${value}`;
  return [h(UniverseLink, { href: route }, () => (children.length > 0 ? children : fallback))];
};
