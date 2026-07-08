/**
 * UBB AST 测试节点构造器。
 *
 * 对应 src/types.ts 的 UbbNode 类型，提供便捷的构造函数减少测试重复。
 */
import type { UbbNode } from "../src/types.ts";

/** 构造 text 节点。 */
export const txt = (value: string): UbbNode => ({ type: "text", value });

/** 构造无参数标签节点（无位置参数、无命名参数）。 */
export const tag = (name: string, children: UbbNode[] = []): UbbNode => ({
  type: "tag",
  tag: name,
  attrs: { positionals: [], named: {} },
  children,
});

/** 构造带位置参数的标签节点。 */
export const tagPos = (name: string, positionals: string[], children: UbbNode[] = []): UbbNode => ({
  type: "tag",
  tag: name,
  attrs: { positionals, named: {} },
  children,
});

/** 构造带命名参数的标签节点。 */
export const tagNamed = (
  name: string,
  named: Record<string, string>,
  children: UbbNode[] = [],
): UbbNode => ({
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
  children: UbbNode[] = [],
): UbbNode => ({
  type: "tag",
  tag: name,
  attrs: { positionals, named },
  children,
});
