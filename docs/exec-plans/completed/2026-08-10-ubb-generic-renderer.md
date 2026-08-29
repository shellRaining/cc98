# UBB 泛型输出注册器执行计划

## 背景

`packages/ubb` 的 HTML 和 Markdown 导出器各自解析源码、递归遍历 AST，再用一组硬编码分支输出字符串。调用方无法在使用前登记新标签，也无法复用同一套 UBB 语法生成字符串以外的结果。

这次重构把标签语法和输出方式拆开。标签注册器负责标签名和 `TagMode`，泛型 renderer 负责把 AST 节点转换成调用方选择的输出类型。HTML 和 Markdown 变成两份 `Renderer<string>` 预设。

## 目标

- 提供链式 `createUbbRegistry().register(name, mode)`，注册结果直接参与解析。
- 提供 `registry.createRenderer<Output, Context>()`，由调用方登记文本转换、兄弟节点合并和每个标签的 handler。
- handler 能读取已渲染 children、纯文本内容、属性、调用上下文，并能渲染任意子树。
- 标签名通过 registry 泛型传递给 handlers，IDE 能补全标签，漏写 handler 时产生类型错误。
- HTML 和 Markdown 共用遍历器，保留各自的格式规则和安全辅助函数。

## 非目标

- 首版不开放正则标签族注册；内置表情标签继续由默认 registry 的 fallback resolver 处理。
- 不把网站的 Vue renderer 迁入 `packages/ubb`。
- 不在本次重构中调整 Markdown 转义、HTML URL 白名单或 CSS 值校验。
- renderer 保持同步，不支持 Promise 输出。

## 方案

注册器保存精确标签到模式的只读快照。每次 `register` 返回新实例，旧实例不受影响。默认 registry 由 `UBB_STATIC_TAG_MODES` 构建，并继续识别内置正则标签族。

renderer 通过两个泛型参数描述输出值和调用上下文：

```ts
const renderer = registry.createRenderer<Output, Context>({
  text: (value, context) => output,
  concat: (parts, context) => output,
  handlers: {
    tag: ({ node, attrs, children, text, context, render }) => output,
  },
});
```

`children` 是惰性缓存 getter，只在 handler 读取时递归渲染。`render(nodes)` 使用同一 renderer 和 context，但不执行顶层 finalizer。公开的 `render(source)` 和 `renderNodes(nodes)` 在根输出完成后执行 finalizer。

## 实施步骤

- [x] 新增 AST 文本提取工具、标签注册器和泛型 renderer。
- [x] 让 parser 接受 tag mode resolver，并保留默认标签行为。
- [x] 把 HTML 和 Markdown 导出器改成 `Renderer<string>` 预设。
- [x] 导出公共类型、默认 registry 和两个预设 renderer。
- [x] 补充运行时、类型推导、上下文、实例隔离和自定义标签测试。
- [x] 更新架构说明，执行格式、类型、测试和构建验证。

## 验证

- `vp run ready` 通过，覆盖全仓格式、lint、类型检查、knip、测试和构建。
- UBB 共 9 个测试文件、197 条测试通过；新增用例覆盖自定义 `recursive`、`text`、`empty`、`autoclose` 标签。
- Website 共 31 个测试文件、291 条测试通过；API 21 条、Utils 1 条测试通过。
- docs、packages 和 website 构建通过。
- 非字符串输出、context 传递、惰性 children、finalizer、任意子树渲染和 registry 隔离均有定向测试。

## 进展与调整

- 2026-08-10：方案确定，开始实现。
- 2026-08-10：实现、文档和全仓验证完成，计划归档。

## 结果

- `createUbbRegistry().register(name, mode)` 提供不可变的链式注册 API，注册后的标签会立即参与解析，标签键会传入 renderer 的 handlers 类型。
- `createRenderer<Output, Context>()` 统一处理 AST 遍历，并向 handler 提供 `node`、`attrs`、惰性 `children`、纯文本 `text`、`context` 和子树 `render()`。
- HTML、Markdown 已迁为两个 `Renderer<string>` 预设，同时保留快捷函数；默认 HTML 预设维持原有文本、属性转义和 URL 协议过滤。
- 公共 API、包说明和仓库架构文档已同步。

## 遗留项

- 正则标签族仍只由默认 registry 识别；自定义正则族注册可在出现真实需求后单独设计。
- 网站现有 Vue renderer 暂不迁移。若未来允许不受信任的第三方 HTML handler，需要另行引入受限 builder 或最终 sanitizer。

## 决策记录

- registry 管标签语法，renderer 管输出，避免为每种输出重复声明 `TagMode`。
- 泛型 renderer 公开，Vue 等非字符串输出可以直接复用；现有网站 renderer 暂不迁移。
- handler 返回的 HTML 字符串属于受信任代码。默认 HTML 预设继续执行现有文本、属性和 URL 处理。
