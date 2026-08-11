# @cc98/ubb

框架无关的 CC98 UBB 解析和输出工具。标签注册器决定一段 UBB 怎样建成 AST，泛型 renderer 决定 AST 怎样变成字符串、VNode 或其他结果。

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

`register()` 返回新的 registry，原实例不会改变。标签名会转成小写，重复注册会抛错。四种解析模式分别是：

- `recursive`：内部继续解析 UBB。
- `text`：内部保持纯文本。
- `empty`：自闭合，不读取 children。
- `autoclose`：结束标签可省略，有结束标签时仍可包裹内容。

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

## 默认预设

包内提供完整的 CC98 标签表以及 HTML、Markdown 两个字符串 renderer：

```ts
import {
  defaultUbbRegistry,
  parseUbb,
  ubbHtmlRenderer,
  ubbMarkdownRenderer,
  ubbToHtml,
  ubbToMarkdown,
} from "@cc98/ubb";
```

`ubbToHtml()` 和 `ubbToMarkdown()` 是两个预设 renderer 的快捷函数。`parseUbb()` 使用默认 CC98 标签表；自定义 registry 使用自己的标签表解析。

自定义 HTML handler 直接返回字符串，属于受信任代码。默认 HTML preset 会转义文本和属性并过滤 URL 协议，但无法约束调用方自行拼接的 HTML。
