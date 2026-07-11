import type { UbbTagNode } from "@cc98/ubb";
import type { VNodeChild } from "vue";
import type { UbbRenderContext } from "./context";

export type RenderUbbChildren = (node: UbbTagNode, context: UbbRenderContext) => VNodeChild[];

export type UbbTagRenderer = (
  node: UbbTagNode,
  context: UbbRenderContext,
  renderChildren: RenderUbbChildren,
) => VNodeChild;
