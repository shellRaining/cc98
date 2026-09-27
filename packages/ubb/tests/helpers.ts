/**
 * UBB AST 测试节点构造器。
 *
 * 构造不含 raw 的节点结构，配合 withoutRaw 只比较树形与属性；raw 由专门的用例覆盖。
 */
import type { UbbNode, UbbTagNode, UbbTextNode } from "../src/types.ts";

export type NodeShape =
  | UbbTextNode
  | (Omit<UbbTagNode, "raw" | "children"> & { children: NodeShape[] });

/** 去掉解析结果中的 raw 字段。 */
export function withoutRaw(nodes: readonly UbbNode[]): NodeShape[] {
  return nodes.map((node) => {
    if (node.type === "text") return node;
    const { raw: _raw, children, ...rest } = node;
    return { ...rest, children: withoutRaw(children) };
  });
}

/** 构造 text 节点。 */
export const txt = (value: string): NodeShape => ({ type: "text", value });

/** 构造无参数标签节点（无位置参数、无命名参数）。 */
export const tag = (name: string, children: NodeShape[] = []): NodeShape => ({
  type: "tag",
  tag: name,
  attrs: { positionals: [], named: {} },
  children,
});

/** 构造由标签族匹配的无参数标签节点。 */
export const familyTag = (name: string, family: string): NodeShape => ({
  type: "tag",
  tag: name,
  family,
  attrs: { positionals: [], named: {} },
  children: [],
});

/** 构造带位置参数的标签节点。 */
export const tagPos = (
  name: string,
  positionals: string[],
  children: NodeShape[] = [],
): NodeShape => ({
  type: "tag",
  tag: name,
  attrs: { positionals, named: {} },
  children,
});

/** 构造带命名参数的标签节点。 */
export const tagNamed = (
  name: string,
  named: Record<string, string>,
  children: NodeShape[] = [],
): NodeShape => ({
  type: "tag",
  tag: name,
  attrs: { positionals: [], named },
  children,
});

/** 构造同时带位置参数和命名参数的标签节点。 */
export const tagBoth = (
  name: string,
  positionals: string[],
  named: Record<string, string>,
  children: NodeShape[] = [],
): NodeShape => ({
  type: "tag",
  tag: name,
  attrs: { positionals, named },
  children,
});
