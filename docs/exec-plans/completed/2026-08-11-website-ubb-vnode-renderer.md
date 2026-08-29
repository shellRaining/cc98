# 网站 UBB Vue renderer 迁移到泛型 renderer 执行计划

## 背景

`packages/ubb` 已重构出标签注册器（`createUbbRegistry`）和泛型输出 renderer（`createRenderer<Output, Context>`），HTML、Markdown 预设共用同一遍历引擎。`apps/website` 的 UBB 渲染层仍是手写遍历：`renderUbbNode.ts` 递归分派、`registry.ts` 用 `resolveUbbTagRenderer` 把标签名映射到 renderer，并在 `rich-content/text.ts` 重复实现包的 `getUbbTextContent`。

上次重构的遗留项写明「网站现有 Vue renderer 暂不迁移」。本次迁移它：让网站复用泛型 renderer 的遍历与惰性缓存，只登记 Vue 输出 handler，输出类型为 `VNodeChild[]`。

## 目标

- `apps/website` 的 UBB 渲染改为 `defaultUbbRegistry.createRenderer<VNodeChild[], UbbRenderContext>`，标签 mode 与 handler 键由包的 registry 泛型串联。
- 删除手写遍历 `renderUbbNode.ts` 和 `resolveUbbTagRenderer` 分派，删除重复的 `getUbbTextContent`。
- 所有渲染行为保持不变，现有 SSR 契约测试全绿；顺带修复 `textStyle` 组对 size/color/font/cursor 子节点重复渲染导致的图片重复计数隐患。

## 非目标

- 不把 Vue renderer 迁入 `packages/ubb`：Vue `h`、`Universe*` 组件、theme store 与 `security.ts` 都属于网站层。
- 不改 Markdown 侧（remark/MDAST 插件机制，不适用本模式）。
- 不拆分共享分组 handler（textStyle 覆盖 9 个标签等）：分组函数改为 props 签名后继续复用，仅失去 per-tag 字面量窄化，无实际损失。

## 方案

`registry.ts` 重写为静态标签 → handler 的映射（沿用 `satisfies Record<UbbStaticTagName, UbbTagRenderer>` 保持完整性编译检查），并导出由 `defaultUbbRegistry` 创建的模块级单例 renderer：

```ts
export const ubbVueRenderer = defaultUbbRegistry.createRenderer<VNodeChild[], UbbRenderContext>({
  text: (value) => [value],
  concat: (parts) => parts.flat(),
  handlers: staticTagHandlers,
  fallback: (props) => {
    if (matchUbbRegexTagFamily(props.node.tag)) return renderEmotionTag(props);
    return [`[${props.node.tag}]${props.text}[/${props.node.tag}]`];
  },
});
```

- `Output = VNodeChild[]`：`text` 包一层数组，`concat` 做一级扁平；每个文本节点多一次数组分配，可忽略。
- 每个 handler 的 `children` 是惰性缓存 getter，`text` 是子树纯文本，`render(nodes)` 渲染任意子树（quote 拉平直接用 `render(layer.children)`）。
- `fallback` 承担正则标签族（em/ac/ms/mahjong/cc98/tb → 表情 renderer）和未知标签字面量兜底。真正未知标签由解析器降级为纯文本，兜底只是安全网。
- `UbbRenderContext`（options + 可变 imageCount）继续作为 `Context` 透传；每次渲染新建，行为不变。
- `UbbRenderer.vue` 改为调用 `ubbVueRenderer.renderNodes(props.nodes, context)`；`ContentRenderer.vue` 改用 `defaultUbbRegistry.parse`，与渲染共用同一注册器。

### 行为差异核对

- 未知标签字面量 `[tag]text[/tag]`、关闭表情时输出 `[em01]` 开标签、quote 拉平顺序：全部保持。
- textStyle 组子节点渲染从「顶层一次 + renderStyledChildren 内一次」改为惰性缓存一次：修复了 `[size=12][img]...[/img][/size]` 等场景图片计数翻倍的问题，输出不变。

## 实施步骤

- [x] 迁移 renderer 模块签名：`textStyle.ts`、`link.ts`、`literal.ts`、`media.ts`、`permission.ts`、`structure.ts`、`emotion/index.ts`，`types.ts` 改为 `UbbTagHandler<VNodeChild[], UbbRenderContext>` 别名。
- [x] 重写 `registry.ts` 为 handlers 映射 + `ubbVueRenderer`，删除 `renderUbbNode.ts`。
- [x] 更新 `UbbRenderer.vue`、`ContentRenderer.vue`；删除 `rich-content/text.ts` 中重复的 `getUbbTextContent`。
- [x] `vp check` 与富内容测试通过。
- [x] 同步 `docs/frontend.md` 与 `ARCHITECTURE.md` 中网站 UBB 渲染层描述。
- [x] `vp run ready` 全量验证通过后归档本计划。

## 验证

- 现有 SSR 契约测试兜底：`all-ubb-tags.test.ts`（47 静态 + 6 正则族）、`content-renderer.test.ts`（引用拉平、图片计数重置、暗色表情、内嵌 Markdown 开关、代码行号等）、`permission.test.ts`。
- `vp run ready` 覆盖格式、lint、类型、knip、测试与构建。

## 进展与调整

- 2026-08-11：方案确定，开始实现。
- 2026-08-11：实现与文档同步完成，`vp run ready` 全量通过（网站 31 个测试文件 291 条、UBB/API/utils 测试与全部构建通过），计划归档。

## 结果

- 网站 UBB 渲染改为 `defaultUbbRegistry.createRenderer<VNodeChild[], UbbRenderContext>`，`registry.ts` 只登记 handler 映射与 `fallback`（正则标签族 → 表情，未知标签字面量兜底）。
- 删除手写遍历 `renderUbbNode.ts`、`resolveUbbTagRenderer` 分派和重复的 `getUbbTextContent`；quote 拉平改用 `render(layer.children)`。
- textStyle 组子节点渲染由惰性 `children` getter 缓存一次，顺带消除了 size/color/font/cursor 下子节点重复渲染导致的图片重复计数隐患。

## 决策记录

- 复用包导出的 `defaultUbbRegistry` 而非自建 registry：标签 mode 单一事实源，新增静态标签时 `satisfies` 与 registry 泛型共同要求同步补 handler。
- 保留 `UbbTagRenderer` 本地类型别名，renderer 模块只改签名不改导出名，缩小 diff。
