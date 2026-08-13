import { h, type CSSProperties, type VNodeChild } from "vue";
import type { UbbTagRenderer } from "./types";

const ALLOWED_CURSOR_VALUES = new Set([
  "auto",
  "default",
  "pointer",
  "text",
  "move",
  "help",
  "wait",
]);

function renderStyledChildren(children: VNodeChild[], style: CSSProperties) {
  return h("span", { style }, children);
}

export const renderTextStyleTag: UbbTagRenderer = ({ node, attrs, children }) => {
  if (node.tag === "b") return [h("strong", children)];
  if (node.tag === "i") return [h("em", children)];
  if (node.tag === "u") return [h("u", children)];
  if (node.tag === "del") return [h("s", children)];
  if (node.tag === "english")
    return [h("span", { style: { fontFamily: "Arial, sans-serif" } }, children)];

  if (node.tag === "size") {
    const value = Number(attrs.positionals[0]);
    if (!Number.isFinite(value)) return children;
    return [renderStyledChildren(children, { fontSize: `${Math.min(72, Math.max(6, value))}pt` })];
  }

  if (node.tag === "color") {
    const color = attrs.positionals[0]?.trim();
    if (!color || color.length > 64) return children;
    return [renderStyledChildren(children, { color })];
  }

  if (node.tag === "font") {
    const fontFamily = attrs.positionals[0]?.trim();
    if (!fontFamily || fontFamily.length > 100) return children;
    return [renderStyledChildren(children, { fontFamily })];
  }

  if (node.tag === "cursor") {
    const cursor = attrs.positionals[0]?.trim();
    if (!cursor || !ALLOWED_CURSOR_VALUES.has(cursor)) return children;
    return [renderStyledChildren(children, { cursor })];
  }

  return children;
};

export const renderAlignmentTag: UbbTagRenderer = ({ node, attrs, children }) => {
  const fixedAlignment = node.tag === "left" || node.tag === "center" || node.tag === "right";
  const requested = fixedAlignment ? node.tag : attrs.positionals[0]?.toLowerCase();
  const textAlign = ["left", "center", "right", "justify"].includes(requested ?? "")
    ? (requested as CSSProperties["textAlign"])
    : undefined;

  if (!textAlign) return children;
  return [h("div", { style: { textAlign } }, children)];
};
