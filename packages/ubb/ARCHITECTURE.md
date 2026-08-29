# @cc98/ubb 架构

框架无关的 CC98 UBB 解析与输出工具。注册器定义标签方言，泛型 renderer 把 AST 转成调用方选择的输出类型，包内提供 HTML 与 Markdown 字符串预设。只读解析，不做编辑器。

## 模块布局

```mermaid
graph TD
  types["types.ts<br/>UbbNode / UbbAttrs"]
  tagData["tag-data.ts<br/>标签字符串 tokenizer"]
  tags["tags.ts<br/>标签模式表 + 正则族"]
  parser["parser.ts<br/>segment 树 → AST"]
  registry["registry.ts<br/>createUbbRegistry / defaultUbbRegistry"]
  renderer["renderer.ts<br/>泛型遍历器"]
  emotion["emotion.ts<br/>表情资源描述"]
  toHtml["presets/html.ts<br/>HTML 预设入口"]
  toMarkdown["presets/markdown.ts<br/>Markdown 预设入口"]
  index["src/index.ts<br/>核心公共导出"]

  tagData --> parser
  tags --> parser
  parser --> types
  registry --> parser
  registry --> renderer
  renderer --> types
  emotion --> toMarkdown
  toHtml --> registry
  toMarkdown --> registry
  index --> registry
```

## 数据流

```mermaid
flowchart LR
  src["UBB 文本"] --> parse["registry.parse / parseUbb"]
  parse --> ast["UbbNode[] 纯数据 AST"]
  ast --> render["createRenderer 遍历"]
  render --> out["调用方 Output：字符串 / VNode / 其他"]
```

- `parseUbb` 用静态表加正则族把文本解析成纯数据 AST，不含渲染信息。
- 遍历器按节点分派：文本节点走 `text()`，标签节点查 `handlers[tag]`，未命中走 `fallback`。handler 收到同一组参数：`node`、`attrs`、惰性 `children`、纯文本 `text`、`context`、子树 `render(nodes)`。
- 公开的 `render(source)` 与 `renderNodes(nodes)` 在根输出完成后执行 `finalize`；子树 `render(nodes)` 不重复执行。
- 根入口 `@cc98/ubb` 只导出解析与泛型 renderer API；字符串预设分别从 `@cc98/ubb/presets/html` 和 `@cc98/ubb/presets/markdown` 导入。
