# UBB tag 渲染设计：[img]

这篇文档记录 `[img]` 的渲染设计，用来 review 和校正实现。后续每个 UBB tag 都按同一格式补一篇，避免把所有规则堆在一份总文档里。

## 目标

UBB 的 `[img]` 和 Markdown 的 `![]()` 最终都显示图片，不应该各自维护一套图片组件和样式。

推荐拆成三层：

```txt
UbbImageRenderer        读取 UBB AST，解释 [img] 的历史语义
MarkdownImageRenderer   读取 Markdown token，解释 ![]() 的语义
UniverseImage           真正渲染图片，负责样式、交互和通用安全边界
```

`UbbImageRenderer` 和 `MarkdownImageRenderer` 是语法适配层，允许不同。`UniverseImage` 是通用组件，应该共享。

## 原项目行为

原项目的 `[img]` 由 `Forum/Ubb/ImageTagHandler.tsx` 处理。关键语义是：

- 图片地址来自 tag 内容。
- `[img]` 和 `[img=0]` 默认显示图片。
- `[img=1]` 默认不显示图片，先显示“点击查看图片”。
- `title=...` 是图片标题。
- `allowImage`、`allowExternalImage`、`maxImageCount` 会影响是否允许显示。
- `allowToolbox` 打开后，图片上有工具栏。

Markdown 的 `![]()` 没有这些历史语义。它只有 `src`、`alt` 和可选 `title`，默认直接显示。

所以差异不在图片组件本身，而在进入图片组件之前的参数解释。

## 数据流

```txt
[img=1,title=封面]https://example.com/a.png[/img]
  -> parseUbb
  -> UbbImageRenderer
  -> UniverseImage

![封面](https://example.com/a.png "标题")
  -> markdown-it token
  -> MarkdownImageRenderer
  -> UniverseImage
```

两条路径最后都进入 `UniverseImage`。

## UniverseImage

`UniverseImage` 不理解 `[img]`，也不理解 Markdown。它只接收已经解释好的 props。

```ts
export interface UniverseImageProps {
  src: string;
  alt?: string;
  title?: string;
  defaultVisible?: boolean;
  allowToolbox?: boolean;
  showCaption?: boolean;
}
```

建议默认值：

```ts
defaultVisible = true;
allowToolbox = false;
showCaption = false;
```

`UniverseImage` 负责：

- 统一图片样式。
- 统一懒加载。
- 统一错误态。
- `defaultVisible=false` 时显示“点击查看图片”按钮。
- `allowToolbox=true` 时显示图片工具栏。
- 根据 `showCaption` 和 `title` 显示标题。

它不负责：

- 判断 `[img=1]` 是什么意思。
- 解析 Markdown 的 `alt/title`。
- 决定某个业务场景是否允许外链图片。
- 统计当前帖子已经显示了多少张图片。

这些属于适配层或渲染上下文。

## UbbImageRenderer

UBB 适配层把 AST 转成 `UniverseImageProps`。

```ts
function renderUbbImage(node: UbbTagNode, ctx: RichContentContext) {
  const src = getTextContent(node.children);
  const mode = node.attrs.positionals[0];
  const title = node.attrs.named.title;

  if (!ctx.options.allowImage) return src;
  if (!ctx.services.canLoadImage(src)) return src;
  if (ctx.state.imageCount.value >= ctx.options.maxImageCount) return src;

  ctx.state.imageCount.value += 1;

  return h(UniverseImage, {
    src,
    title,
    alt: title ?? "",
    defaultVisible: mode !== "1",
    allowToolbox: ctx.options.allowToolbox,
    showCaption: Boolean(title),
  });
}
```

这里保留了 UBB 的历史语义：`[img=1]` 默认隐藏。Markdown 不应该继承这个规则。

## MarkdownImageRenderer

Markdown 适配层只处理 Markdown 图片 token。

```ts
function renderMarkdownImage(token: MarkdownImageToken, ctx: RichContentContext) {
  if (!ctx.services.canLoadImage(token.src)) return token.alt ?? token.src;

  return h(UniverseImage, {
    src: token.src,
    alt: token.alt ?? "",
    title: token.title,
    defaultVisible: true,
    allowToolbox: false,
    showCaption: Boolean(token.title),
  });
}
```

Markdown 的普通图片默认显示，不显示 UBB 的工具栏。以后如果希望 Markdown 图片也支持工具栏，应通过业务配置打开，而不是让 `UniverseImage` 判断来源。

## 样式

图片样式只写一份，挂在 `UniverseImage` 上。

UnoCSS 里可以用 shortcuts 表达语义类：

```ts
shortcuts: {
  "universe-image": "my-3 max-w-full rounded",
  "universe-image-hidden": "inline-flex cursor-pointer select-none items-center justify-center rounded border border-cc98-primary px-3 py-1.5 text-cc98-primary hover:bg-cc98-primary hover:text-white",
  "universe-image-caption": "mt-1 text-center text-sm text-cc98-text-muted",
}
```

主题颜色继续走 CSS 变量。UnoCSS 负责类名组合，CSS 变量负责运行时换肤。

```css
:root {
  --cc98-rich-image-border: var(--cc98-color-border);
  --cc98-rich-image-action: var(--cc98-color-primary);
}

:root[data-theme="dark"] {
  --cc98-rich-image-border: var(--cc98-color-border);
  --cc98-rich-image-action: var(--cc98-color-primary);
}
```

如果 shortcut 需要更细的图片颜色，可以在 UnoCSS theme 中把 `cc98.rich.image-action` 映射到 `var(--cc98-rich-image-action)`。

## 安全边界

图片 URL 必须经过同一个服务函数处理，不能 UBB 一套、Markdown 一套。

```ts
interface RichContentServices {
  canLoadImage(src: string): boolean;
  sanitizeImageUrl(src: string): string | null;
}
```

默认策略：

- 允许站内相对路径。
- 允许 `https:` 图片。
- 是否允许 `http:` 由产品策略决定。
- 禁止 `javascript:`、`data:`、`file:`。
- 外链图片受 `allowExternalImage` 控制。

`UniverseImage` 可以再次兜底调用 `sanitizeImageUrl`，但主要判断应在适配层完成。这样适配层能决定降级成纯文本、链接或提示文案。

## 目录落点

建议先放在 `apps/website/src/components/rich-content/`：

```txt
rich-content/
  universe/
    UniverseImage.vue
  ubb/
    renderers/image.ts
  markdown/
    renderers/image.ts
  context.ts
  security.ts
```

后续如果富内容渲染稳定，再考虑抽到包里。现在先留在 `apps/website`，方便接入主题、媒体组件和业务配置。

## 这条规则如何推广

`[img]` 的拆法可以推广到其它内容：

- `[url]` 和 Markdown link 共享 `UniverseLink`。
- `[code]` 和 Markdown fenced code 共享 `UniverseCodeBlock`。
- `[table]` 和 Markdown table 共享 `UniverseTable`。
- `[audio]`、`[video]`、`[bili]` 共享 `UniverseAudio`、`UniverseVideo`、`UniverseBili`。

判断标准很简单：如果最终 UI 和交互是一类东西，就做成 `Universe*`；如果只是某种语法才有的历史规则，就留在 `ubb/` 或 `markdown/` 适配层。
