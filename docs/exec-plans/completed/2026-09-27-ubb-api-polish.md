# UBB 公共接口整理

## 背景

`@cc98/ubb` 完成通用化后，接口评审发现几处不利于调用方的问题：

- 正则标签族（表情）只能通过 `resolveUnknownTag` 接入，渲染时拿不到所属族，网站和 Markdown 预设只能在 fallback 里重新匹配正则。
- AST 丢掉了原始标签文本，fallback 无法无损回退，autoclose 标签也分不清是否写了结束标签。
- CC98 标签头解析器没有导出，注册器创建后不能注销标签或调整配置，CC98 规则无法局部复用。
- renderer 选项的 `text` 与 handler 参数的 `text`、`children` 含义互相冲突。
- 相邻文本节点不合并；HTML、Markdown 预设路径看起来像通用预设；根入口同时导出 `parseUbb` 和注册器两套解析入口；版本号仍是 `0.0.0`；包声明了并未使用的 `vue` peerDependency。

## 目标

每项独立提交，并附带测试：

1. 注册器支持正则标签族，AST 节点带 `family`，handler 可按族名登记。
2. 标签节点保留原始开始、结束标签文本。
3. 导出 CC98 标签头解析器；注册器支持 `unregister` 和 `configure`。
4. 统一 renderer 与 handler 参数命名。
5. 新增合并相邻文本节点的注册器选项。
6. CC98 输出预设改到 `@cc98/ubb/cc98/html`、`@cc98/ubb/cc98/markdown`。
7. 根入口不再导出 `parseUbb`。
8. 版本号升到 `1.0.0`。
9. 移除未使用的 `vue` 依赖声明。

## 非目标

- handler 参数新增 `value` 快捷字段：需要先向开发者说明后再定。
- 落单 `[` 吞掉后续标签的问题：先在旧站实测，再决定兼容还是修正。
- HTML 预设的 CSS 值校验和 Markdown 转义：属于预设质量问题，另行评估。

## 方案

注册器改为单个选项对象创建，精确标签和标签族对称：

```ts
createUbbRegistry({
  tags: { b: "recursive" },
  families: { em: { pattern: /^em\d{2}$/, mode: "empty" } },
  parseTag,
  mergeAdjacentText: true,
})
  .register("code", "text")
  .registerFamily("ac", /^ac\d{2}$/, "empty")
  .unregister("b")
  .configure({ mergeAdjacentText: false });
```

- 精确标签优先，未命中时按登记顺序匹配标签族；族名与标签名共用 handler 命名空间，重名时抛错。
- 标签族正则不允许 `g`、`y` 标志，避免 `test()` 受 `lastIndex` 影响。
- 标签节点新增 `family` 与 `raw: { open: string; close: string | null }`。renderer 先按 `family`、再按 `tag` 查找 handler。
- renderer 选项 `text` 改为 `renderText`；handler 参数 `children` 改为 `content`、`text` 改为 `textContent`、`render` 改为 `renderNodes`；`TagMode` 改为 `UbbTagMode`。

## 实施步骤

- [x] 正则标签族：`registerFamily`、`families` 选项，CC98 表情改为六个标签族，网站和 Markdown 预设按族名登记 handler
- [x] 原始标签文本：`raw.open`、`raw.close`，网站和 Markdown 预设的回退改用原文
- [x] CC98 规则复用：导出 `parseCc98Tag`，新增 `unregister`、`configure`
- [x] 命名统一
- [x] 合并相邻文本选项：`mergeAdjacentText`，默认关闭
- [x] 预设路径迁移：`@cc98/ubb/cc98/html`、`@cc98/ubb/cc98/markdown`
- [x] 移除根入口 `parseUbb`
- [x] 版本号 `1.0.0`
- [x] 移除 `vue` 依赖声明

## 验证

- 每次提交前运行 `vp check`、`vp run @cc98/ubb#test`，涉及网站时运行 `vp run website#test`，全部通过。
- 收尾运行 `vp run ready`：构建、格式、lint、类型检查、Knip 和全量测试通过。包内测试 226 个，网站测试 314 个。
- 新增测试：标签族的匹配顺序、族名 handler、名称冲突与正则标志（含没有 fallback 时漏登记标签族的类型错误）；`raw` 的大小写、结束标签有无，以及任意输入按原文拼回与输入一致；CC98 规则组合、`unregister`、`configure`；相邻文本合并；根入口公开 API、版本号一致、发布代码不导入外部包。
- `bench:large` 与 `main` 对比：1MB 约 35ms，12MB 约 325ms，与改动前处于同一水平。

## 进展与调整

- 实现 `raw` 与标签族后，12MB 基准比 `main` 慢约 25%。原因是按条件展开 `family` 让标签节点出现两种对象形状并多分配临时对象。改为始终写入 `family`（精确标签为 `undefined`）后恢复，单独提交为性能优化。
- Knip 发现移除 `parseUbb` 导出后 `UbbTagResolver` 只剩内部使用，已并回对应提交。
- 孤立结束标签降级为文本时改为保留原文大小写（`[/B]` 不再变成 `[/b]`），这是 `raw` 改动的附带结果。

## 决策记录

- `createUbbRegistry` 改为接收单个选项对象，精确标签与标签族在创建时和链式调用中对称。
- `raw` 设为必填字段，描述的是解析器的实际输出；手工构造 AST 的调用方需要自行补上。
- `configure` 只覆盖解析配置，始终保留已登记的标签表和族表，避免调用方传入的对象意外带上 `tags` 字段。
- `mergeAdjacentText` 默认关闭，现有 AST 结构和网站渲染不变。

## 遗留项

- handler 参数是否增加 `value`（`positionals[0]` 的快捷字段）：待向开发者说明后决定。
- 落单 `[` 会吞掉紧跟的标签（如 `价格[约[b]100[/b]`）：需要先在旧站实测，再决定兼容还是修正。
- HTML 预设的 CSS 参数值校验、协议相对地址放行，以及 Markdown 预设的正文转义：属于预设质量问题，另行评估。
- 网站是否开启 `mergeAdjacentText`：本次未改动，可按渲染需要再定。
