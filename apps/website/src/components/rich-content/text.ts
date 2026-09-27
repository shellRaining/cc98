import type { UbbTagNode } from "ubb-core";

/** 无子节点的标签按原文还原，用于无法渲染时降级显示。 */
export function getOriginalUbbTag(node: Readonly<UbbTagNode>): string {
  return `${node.raw.open}${node.raw.close ?? ""}`;
}
