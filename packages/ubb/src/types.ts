/**
 * UBB AST 节点类型定义。
 *
 * parseUbb 把 UBB 文本解析成这棵纯数据树，不包含任何渲染信息。
 * 字符串导出器和 Vue 渲染层各自遍历这棵树产出输出。
 */

/**
 * UBB AST 节点。
 *
 * - text：纯文本片段
 * - tag：标签节点，带标签名、属性、子节点
 */
export type UbbNode = UbbTextNode | UbbTagNode;

/** 纯文本节点。 */
export type UbbTextNode = {
  type: "text";
  value: string;
};

/** 标签节点。 */
export type UbbTagNode = {
  type: "tag";
  /** 标签名，已归一化为小写。如 "b"、"url"、"ac01"。 */
  tag: string;
  /** 标签属性。 */
  attrs: UbbAttrs;
  /** 子节点。Empty 标签恒为空数组。 */
  children: UbbNode[];
};

/**
 * 标签属性。
 *
 * 参数模型有两种形态，具体拆分规则由标签头解析函数决定：
 *
 * - 无名位置参数：`[color=red]` 的 red、`[upload=jpg,1]` 的 jpg 和 1。
 *   按出现顺序存入 positionals 数组。多个位置参数属于 CC98 预设的规则。
 *
 * - 命名参数：`[img=1,title=封面]` 的 title=封面。
 *   存入 named 对象。命名参数属于 CC98 预设的规则。
 *
 * 示例：
 *   [b]                 → { positionals: [], named: {} }
 *   [color=red]         → { positionals: ["red"], named: {} }
 *   [upload=jpg,1]      → { positionals: ["jpg", "1"], named: {} }
 *   [img=1,title=封面]  → { positionals: ["1"], named: { title: "封面" } }
 */
export type UbbAttrs = {
  positionals: string[];
  named: Record<string, string>;
};
