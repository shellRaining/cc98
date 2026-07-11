# UBB 文档大纲

这个目录记录 UBB 解析、渲染和迁移相关的长期设计。这里放稳定规格，不放一次性的执行记录。带日期的推进计划仍放在 `docs/exec-plans/`。

## 当前文件

```txt
docs/ubb/
  README.md              当前文档，说明 UBB 文档如何拆分
  img.md                 [img] 的渲染设计
```

目前只先落 `img.md`。其它文档等方案敲定或实现推进到对应部分时再建，不提前占文件名。

## 文档类型

### 总设计文档

总设计文档回答跨 tag 的问题，例如：

- `UbbRenderer` 如何遍历 `UbbNode[]`。
- UBB 和 Markdown 如何共享 `Universe*` 组件。
- UnoCSS 和 CSS 变量如何支撑换肤。
- 用户输入进入样式、链接、图片、媒体时如何做安全收敛。
- 哪些地方为了兼容现有内容，比原项目更宽松。

这类文档如果后续需要，再放在 `docs/ubb/` 根目录。

### Tag 设计文档

tag 设计文档回答某个 tag 的具体行为，例如：

- 原项目怎么处理这个 tag。
- 新项目解析层已经给出什么 AST。
- 渲染层应该落到哪个 `Universe*` 组件。
- 哪些行为属于 UBB 独有适配。
- 它和 Markdown 是否共享 UI。
- 安全和样式有什么特殊点。

这些文档直接放在 `docs/ubb/`。如果一组 tag 强相关，可以合并成一篇，比如 `table.md` 覆盖 `[table]`、`[tr]`、`[td]`、`[th]`。

### 执行计划

执行计划回答某一次开发怎么推进，例如：

- 第一阶段先实现哪些 tag。
- 每一步怎么验收。
- 哪些页面先接入。
- 哪些风险要在本次迭代解决。

这些文档放在 `docs/exec-plans/`，并引用 `docs/ubb/` 下的长期规格。

## 渲染组件目录结构

富内容渲染先放在 `apps/website`，等边界稳定后再考虑抽包。目录按“入口、共享组件、UBB 适配、Markdown 适配”拆开：

```txt
apps/website/src/components/rich-content/
  ContentRenderer.vue

  options.ts
  security.ts
  types.ts

  universe/
    UniverseRoot.vue
    UniverseLink.vue
    UniverseImage.vue
    UniverseQuote.vue
    UniverseCodeBlock.vue
    UniversePlainText.vue
    UniverseUpload.vue
    UniverseAudio.vue
    UniverseVideo.vue
    UniverseBili.vue
    UniverseMath.vue
    UniverseMessageBar.vue

  ubb/
    UbbRenderer.vue
    context.ts
    renderUbbNode.ts
    registry.ts
    textStyle.ts
    link.ts
    structure.ts
    literal.ts
    media.ts
    permission.ts
    emotion/
      resolveEmotionTag.ts
      UbbEmotion.vue

  markdown/
    MarkdownRenderer.vue
    markdownIt.ts
    renderMarkdownToken.ts
```

`universe/` 放共享 UI 组件，不理解 UBB 或 Markdown 的具体语法。`ubb/` 和 `markdown/` 负责语法适配，把各自的解析结果转换成共享 UI、专有组件或纯文本降级。

如果某个能力只有 UBB 有，比如表情和权限 tag，就留在 `ubb/` 里；如果它最后是通用 UI，比如图片、链接、代码块、表格和媒体，就应该落到 `Universe*`。

`ContentRenderer` 对外只接收内容、格式和 `RichContentOptions`。UBB 遍历需要的图片计数等状态由 `UbbRenderer` 在内部创建，不把 viewer、topic 或可变遍历状态塞进页面 props。

权限 tag 沿用原项目语义：它们表示服务端已经做出的权限结果，前端只按参数显示提示消息，不重新判断权限，也不包裹后续节点。

Markdown 入口显式关闭原始 HTML。UBB 和 Markdown 的链接、图片 URL 共用安全函数，不允许各自维护协议白名单。UBB 内的 `[md]` 可以由 `allowEmbeddedMarkdown` 关闭，顶层 Markdown 内容是否渲染由页面选择的内容类型决定。

## 设计原则

1. 解析和渲染分开。`packages/ubb` 负责 UBB AST，Vue 渲染层负责把 AST 转成组件。
2. 语法适配和视觉组件分开。UBB 独有规则放在 `ubb/` 适配层，共享 UI 落到 `Universe*` 组件。
3. UBB 和 Markdown 可以有不同 renderer，但应共享链接、图片、代码块、表格、媒体等通用组件。
4. 样式使用 UnoCSS shortcuts 表达组件语义，颜色和换肤继续走 CSS 变量。
5. 安全策略集中维护，不能让 UBB、Markdown 和各组件各写一套 URL 或媒体白名单。
6. 每个 tag 的历史行为要能追溯到原项目文件，不能只写新实现想怎么做。
7. 第一版就复用跨格式的 `Universe*` 组件，但不强迫 UBB 专有能力套进共享层。Markdown 解析器、UBB 表情等源格式专有能力保留在各自适配目录。
8. `packages/ubb` 已知的每个 tag 都必须在渲染注册表中显式处理。新增 tag 没有对应 renderer 时，覆盖测试应直接失败。
9. 测试按分支、状态和边界组织，不按处理器文件数量机械铺开。
10. 正则标签族的匹配规则只在 `packages/ubb` 维护，网站使用解析包导出的稳定 family，不复制正则。
