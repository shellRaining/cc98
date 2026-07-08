/**
 * UBB AST 节点类型定义。
 *
 * parseUbb 把 UBB 文本解析成这棵纯数据树，不包含任何渲染信息。
 * 导出器（toHtml / toMarkdown）和 Vue 渲染层各自遍历这棵树产出输出。
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
 * CC98 的 UBB 参数模型有两种形态（移植自 Core.tsx 的 UbbTagData）：
 *
 * - 无名位置参数：`[color=red]` 的 red、`[upload=jpg,1]` 的 jpg 和 1。
 *   按出现顺序存入 positionals 数组，老代码用 tagData.value(0)、value(1) 按索引读取。
 *
 * - 命名参数：`[img=1,title=封面]` 的 title=封面。
 *   存入 named 对象，老代码用 tagData.value('title') 按名称读取。
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
