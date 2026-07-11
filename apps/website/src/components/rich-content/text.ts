import type { UbbNode } from "@cc98/ubb";

export function getUbbTextContent(nodes: readonly UbbNode[]): string {
  return nodes
    .map((node) => (node.type === "text" ? node.value : getUbbTextContent(node.children)))
    .join("");
}

export function getOriginalUbbTag(tag: string): string {
  return `[${tag}]`;
}
