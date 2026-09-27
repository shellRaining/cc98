import { h } from "vue";
import { sanitizeLinkUrl } from "../security";
import UniverseLink from "../universe/UniverseLink.vue";
import type { UbbTagRenderer } from "./types";

export const renderUrlTag: UbbTagRenderer = ({ attrs, textContent, content, context }) => {
  const source = attrs.positionals[0] ?? textContent;
  const href = sanitizeLinkUrl(source, context.options);
  if (!href) return content;

  return [h(UniverseLink, { href }, () => (content.length > 0 ? content : href))];
};

export const renderSiteLinkTag: UbbTagRenderer = ({ node, attrs, textContent, content }) => {
  const label = textContent.trim();
  const value = (attrs.positionals[0] ?? label).trim();
  if (!value) return content;

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
  if (!route) return [label || value];

  const fallback =
    node.tag === "user" ? `@${value}` : node.tag === "topic" ? `帖子 ${value}` : `板块 ${value}`;
  return [h(UniverseLink, { href: route }, () => (content.length > 0 ? content : fallback))];
};
