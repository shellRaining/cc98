# ubb-core

框架无关的 UBB 解析和输出工具。自己注册标签，或使用包内的 CC98 标签规则；同一份解析结果可以输出字符串、VNode 或其他结果。

## 注册标签并创建 renderer

```ts
import { createUbbRegistry } from "ubb-core";

const ubb = createUbbRegistry()
  .register("b", "recursive")
  .register("code", "text")
  .register("line", "empty")
  .register("spoiler", "recursive");

const html = ubb.createRenderer<string>({
  renderText: escapeHtml,
  concat: (parts) => parts.join(""),
  handlers: {
    b: ({ content }) => `<strong>${content}</strong>`,
    code: ({ content }) => `<pre><code>${content}</code></pre>`,
    line: () => "<hr>",
    spoiler: ({ attrs, content }) => {
      const title = escapeHtml(attrs.positionals[0] ?? "剧透");
      return `<details><summary>${title}</summary>${content}</details>`;
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

标签节点的 `raw` 记录开始、结束标签的原文，例如 `[URL=a.com]x[/Url]` 得到 `{ open: "[URL=a.com]", close: "[/Url]" }`。没写结束标签时 `close` 为 `null`，可以借此区分 `[user=张三]` 和 `[user=张三][/user]`。handler 无法渲染某个标签时，用 `raw.open`、子节点和 `raw.close` 能把它原样还原。

创建注册器时也可以一次传入全部配置，效果与逐个 `register()` 相同：

```ts
const registry = createUbbRegistry({
  tags: { badge: "empty" },
  parseTag: (source) => {
    const match = /^badge:(\w+)$/.exec(source);
    if (!match) return null;
    return { name: "badge", attrs: { positionals: [match[1]], named: {} } };
  },
});

registry.parse("[badge:gold]");
```

`parseTag` 用来替换不同论坛的参数语法，不必重写整个 UBB 解析器。

降级为文本的标签默认各自占一个文本节点，`价格[约[b]100[/b]` 会得到四个相邻的文本节点。需要更紧凑的 AST 时，传入 `mergeAdjacentText: true`，相邻文本会合并成一个节点。

`parseTag` 收到 `[` 与 `]` 之间的原始字符串，返回标签名和属性；返回 `null` 或抛错时，原文会作为文本保留。标签名会转为小写，`attrs` 使用 `{ positionals: string[], named: Record<string, string> }`。这是标签头的参数解析接口，不负责匹配结束标签或修改文本容错规则。回调可作为独立函数复用，避免在每个标签上重复拆参数。

## 标签族

表情这类按编号成批出现的标签，用正则登记成一个标签族：

```ts
const ubb = createUbbRegistry()
  .register("b", "recursive")
  .registerFamily("emoji", /^em\d{2}$/, "empty");

ubb.parse("[em01]");
// [{ type: "tag", tag: "em01", family: "emoji", attrs: …, children: [] }]

const html = ubb.createRenderer<string>({
  renderText: escapeHtml,
  concat: (parts) => parts.join(""),
  handlers: {
    b: ({ content }) => `<strong>${content}</strong>`,
    emoji: ({ node }) => `<img src="/emoji/${node.tag}.gif">`,
  },
});
```

精确标签优先匹配，未命中时按登记顺序尝试各个标签族，第一个匹配的生效。正则收到的是转成小写后的标签名，不能带 `g` 或 `y` 标志。标签名和族名共用 handler 的键，不能重名。命中标签族的节点带 `family` 字段，renderer 按族名查找 handler，`node.tag` 仍是具体标签名。

## Handler 参数

每个 handler 会收到同一组参数：

```ts
({ node, attrs, content, textContent, context, renderNodes }) => output;
```

- `node` 是当前标签节点，`attrs` 等于 `node.attrs`。注意 `node.children` 是子节点 AST，`content` 才是渲染结果。
- `content` 是子节点的渲染结果，首次读取时计算并缓存。
- `textContent` 是子树的纯文本内容。
- `context` 是调用 `render(source, context)` 时传入的值。
- `renderNodes(nodes)` 使用当前 renderer 和 context 渲染任意子树，不执行根级 `finalize`。

`createRenderer<Output, Context>()` 的 `Output` 不限于字符串。调用方只需提供 `renderText()` 和 `concat()`，就能输出 VNode、ReactNode 或自己的 AST。

## CC98 预设

CC98 标签和表情规则从 `ubb-core/cc98` 导入。它沿用旧论坛的逗号、等号、引号参数语法，表情登记为 `em`、`ac`、`ms`、`mahjong`、`cc98`、`tb` 六个标签族；HTML、Markdown 输出从独立子路径导入：

```ts
import { cc98Registry } from "ubb-core/cc98";
import { ubbHtmlRenderer, ubbToHtml } from "ubb-core/cc98/html";
import { ubbMarkdownRenderer, ubbToMarkdown } from "ubb-core/cc98/markdown";

const nodes = cc98Registry.parse("[color=red]正文[/color]");
```

CC98 规则也可以拆开复用。`parseCc98Tag` 是旧论坛的标签头解析函数，可以配给自己的标签集；`unregister()` 移除一个标签或标签族，`configure()` 替换 `parseTag` 等解析配置，两者都返回新的注册器：

```ts
import { cc98Registry, parseCc98Tag } from "ubb-core/cc98";

// 自己的标签，沿用 CC98 的参数写法
const forum = createUbbRegistry({ tags: { spoiler: "recursive" }, parseTag: parseCc98Tag });

// 在 CC98 规则上改一个标签的模式
const custom = cc98Registry.unregister("md").register("md", "recursive");
```

`ubbToHtml()` 和 `ubbToMarkdown()` 是两个 CC98 renderer 的快捷函数。解析统一走注册器的 `parse()`，解析规则和 renderer 因此总是同一份配置。

自定义 HTML handler 直接返回字符串，属于受信任代码。默认 HTML preset 会转义文本和属性并过滤 URL 协议，但无法约束调用方自行拼接的 HTML。
