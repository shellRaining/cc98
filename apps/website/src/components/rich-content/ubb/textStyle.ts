import type { UbbTagNode } from "@cc98/ubb";
import { h, type CSSProperties } from "vue";
import type { UbbRenderContext } from "./context";
import type { RenderUbbChildren, UbbTagRenderer } from "./types";

function renderStyledChildren(
  node: UbbTagNode,
  context: UbbRenderContext,
  renderChildren: RenderUbbChildren,
  style: CSSProperties,
) {
  return h("span", { style }, renderChildren(node, context));
}

export const renderTextStyleTag: UbbTagRenderer = (node, context, renderChildren) => {
  const children = renderChildren(node, context);

  if (node.tag === "b") return h("strong", children);
  if (node.tag === "i") return h("em", children);
  if (node.tag === "u") return h("u", children);
  if (node.tag === "del") return h("s", children);
  if (node.tag === "english")
    return h("span", { style: { fontFamily: "Arial, sans-serif" } }, children);

  if (node.tag === "size") {
    const value = Number(node.attrs.positionals[0]);
    if (!Number.isFinite(value)) return children;
    return renderStyledChildren(node, context, renderChildren, {
      fontSize: `${Math.min(72, Math.max(6, value))}pt`,
    });
  }

  if (node.tag === "color") {
    const color = node.attrs.positionals[0]?.trim();
    if (!color || color.length > 64) return children;
    return renderStyledChildren(node, context, renderChildren, { color });
  }

  if (node.tag === "font") {
    const fontFamily = node.attrs.positionals[0]?.trim();
    if (!fontFamily || fontFamily.length > 100) return children;
    return renderStyledChildren(node, context, renderChildren, { fontFamily });
  }

  if (node.tag === "cursor") {
    const cursor = node.attrs.positionals[0]?.trim();
    const allowed = new Set(["auto", "default", "pointer", "text", "move", "help", "wait"]);
    if (!cursor || !allowed.has(cursor)) return children;
    return renderStyledChildren(node, context, renderChildren, { cursor });
  }

  return children;
};

export const renderAlignmentTag: UbbTagRenderer = (node, context, renderChildren) => {
  const fixedAlignment = node.tag === "left" || node.tag === "center" || node.tag === "right";
  const requested = fixedAlignment ? node.tag : node.attrs.positionals[0]?.toLowerCase();
  const textAlign = ["left", "center", "right", "justify"].includes(requested ?? "")
    ? (requested as CSSProperties["textAlign"])
    : undefined;

  if (!textAlign) return renderChildren(node, context);
  return h("div", { style: { textAlign } }, renderChildren(node, context));
};
