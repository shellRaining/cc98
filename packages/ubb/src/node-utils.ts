import type { UbbNode } from "./types.ts";

/** 递归提取一组 UBB AST 节点中的纯文本。 */
export function getUbbTextContent(nodes: readonly UbbNode[]): string {
  return nodes
    .map((node) => (node.type === "text" ? node.value : getUbbTextContent(node.children)))
    .join("");
}
