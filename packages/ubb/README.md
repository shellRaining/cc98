# @cc98/ubb

框架无关的 UBB 解析和输出工具。自己注册标签，或使用包内的 CC98 标签规则；同一份解析结果可以输出字符串、VNode 或其他结果。

## 注册标签并创建 renderer

```ts
import { createUbbRegistry } from "@cc98/ubb";

const ubb = createUbbRegistry()
  .register("b", "recursive")
  .register("code", "text")
  .register("line", "empty")
  .register("spoiler", "recursive");

const html = ubb.createRenderer<string>({
  text: escapeHtml,
  concat: (parts) => parts.join(""),
  handlers: {
    b: ({ children }) => `<strong>${children}</strong>`,
    code: ({ children }) => `<pre><code>${children}</code></pre>`,
    line: () => "<hr>",
    spoiler: ({ attrs, children }) => {
      const title = escapeHtml(attrs.positionals[0] ?? "剧透");
      return `<details><summary>${title}</summary>${children}</details>`;
    },
  },
});

html.render("[spoiler=注意][b]隐藏内容[/b][/spoiler]");
```

`register()` 返回新的 registry，原实例不会改变。标签名会转成小写，重复注册会抛错。`parse()` 在内部按注册规则判断标签模式。四种解析模式分别是：

- `recursive`：内部继续解析 UBB。
- `text`：内部保持纯文本。
- `empty`：自闭合，不读取 children。
- `autoclose`：结束标签可省略，有结束标签时仍可包裹内容。

默认标签头支持 `[tag]` 和 `[tag=value]`，等号之后的内容原样放在 `attrs.positionals[0]`。注册器默认不识别任何标签；未注册、未闭合或解析失败的标签按原文保留。

不同论坛的参数语法可以在创建注册器时替换，不必重写整个 UBB 解析器：

```ts
const registry = createUbbRegistry(
  { badge: "empty" },
  {
    parseTag: (source) => {
      const match = /^badge:(\w+)$/.exec(source);
      if (!match) return null;
      return { name: "badge", attrs: { positionals: [match[1]], named: {} } };
    },
  },
);

registry.parse("[badge:gold]");
```

`parseTag` 收到 `[` 与 `]` 之间的原始字符串，返回标签名和属性；返回 `null` 或抛错时，原文会作为文本保留。标签名会转为小写，`attrs` 使用 `{ positionals: string[], named: Record<string, string> }`。这是标签头的参数解析接口，不负责匹配结束标签或修改文本容错规则。回调可作为独立函数复用，避免在每个标签上重复拆参数。

## Handler 参数

每个 handler 会收到同一组参数：

```ts
({ node, attrs, children, text, context, render }) => output;
```

- `children` 是子节点的渲染结果，首次读取时计算并缓存。
- `text` 是子树的纯文本内容。
- `context` 是调用 `render(source, context)` 时传入的值。
- `render(nodes)` 使用当前 renderer 和 context 渲染任意子树，不执行根级 `finalize`。

`createRenderer<Output, Context>()` 的 `Output` 不限于字符串。调用方只需提供 `text()` 和 `concat()`，就能输出 VNode、ReactNode 或自己的 AST。

## CC98 预设

CC98 标签和表情规则从 `@cc98/ubb/cc98` 导入。它沿用旧论坛的逗号、等号、引号参数语法；HTML、Markdown 输出从独立子路径导入：

```ts
import { cc98Registry } from "@cc98/ubb/cc98";
import { ubbHtmlRenderer, ubbToHtml } from "@cc98/ubb/presets/html";
import { ubbMarkdownRenderer, ubbToMarkdown } from "@cc98/ubb/presets/markdown";

const nodes = cc98Registry.parse("[color=red]正文[/color]");
```

`ubbToHtml()` 和 `ubbToMarkdown()` 是两个 CC98 renderer 的快捷函数。根入口的 `parseUbb(source, options)` 不预装任何标签；通常直接用注册器的 `parse()`，使解析规则与 renderer 使用同一配置。

自定义 HTML handler 直接返回字符串，属于受信任代码。默认 HTML preset 会转义文本和属性并过滤 URL 协议，但无法约束调用方自行拼接的 HTML。
