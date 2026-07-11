import type { UbbNode, UbbTagNode } from "@cc98/ubb";
import type { VNodeChild } from "vue";
import { getUbbTextContent } from "../text";
import type { UbbRenderContext } from "./context";
import { resolveUbbTagRenderer } from "./registry";

export function renderUbbChildren(node: UbbTagNode, context: UbbRenderContext): VNodeChild[] {
  return renderUbbNodes(node.children, context);
}

export function renderUbbNode(node: UbbNode, context: UbbRenderContext): VNodeChild {
  if (node.type === "text") return node.value;
  const renderer = resolveUbbTagRenderer(node.tag);
  if (!renderer) return `[${node.tag}]${getUbbTextContent(node.children)}[/${node.tag}]`;
  return renderer(node, context, renderUbbChildren);
}

export function renderUbbNodes(nodes: readonly UbbNode[], context: UbbRenderContext): VNodeChild[] {
  return nodes.map((node) => renderUbbNode(node, context));
}
