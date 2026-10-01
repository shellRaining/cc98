import type { UbbNode } from "./types.ts";

/** 使用显式遍历栈提取纯文本，避免极深或宽输入触发调用栈限制。 */
export function getUbbTextContent(nodes: readonly UbbNode[]): string {
  const parts: string[] = [];
  const frames = [{ nodes, next: 0 }];
  while (frames.length) {
    const frame = frames[frames.length - 1];
    if (frame.next === frame.nodes.length) {
      frames.pop();
      continue;
    }
    const node = frame.nodes[frame.next++];
    if (node.type === "text") parts.push(node.value);
    else frames.push({ nodes: node.children, next: 0 });
  }
  return parts.join("");
}
