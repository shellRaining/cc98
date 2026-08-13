# @cc98/ubb 子包

agent-first 工作流：本文件是进入 `packages/ubb` 的目录（TOC），不是百科全书。深度内容在各源码文件头部注释、`README.md` 与 `ARCHITECTURE.md` 中，按需加载，省 context。

## 定位

框架无关的 CC98 UBB 解析与输出工具。注册器定义标签方言，泛型 renderer 把 AST 转成调用方选择的输出类型，包内提供 HTML 和 Markdown 字符串预设。只读解析，不做编辑器。

## 常用命令

- `vp run @cc98/ubb#test`：运行本包测试（9 个测试文件）
- `vp run @cc98/ubb#build`：构建 `dist/`，改了公共导出后必跑
- `vp run @cc98/ubb#bench`：解析器性能基准；`bench:large` 为大数据量基准
- `vp run @cc98/ubb#check`：格式、lint、类型检查
- 全仓提交前跑根目录 `vp run ready`

## 何时读什么

开工前：

- `README.md`：公共 API 用法、handler 参数与四种标签模式说明
- `ARCHITECTURE.md`：模块布局、数据流与关键设计
- `src/index.ts`：公共导出清单

按需：

- `src/tags.ts`：静态标签模式表与正则标签族（em/ac/ms/mahjong/cc98/tb）
- `src/parser.ts`：解析容错行为（未闭合、孤立结束、未知标签降级规则）
- `src/registry.ts`、`src/renderer.ts`：注册与遍历核心，handler 的惰性 `children`、`text`、`context`、`render(nodes)`
- `src/tag-data.ts`：标签字符串 tokenizer（逗号、等号、引号规则）
- `src/to-html.ts`、`src/to-markdown.ts`：两个字符串预设（转义与 URL 白名单在 HTML 预设）
- `src/emotion.ts`：表情资源 URL 与编号规则
- `tests/`：行为契约；`bench/`：性能基线

## 核心约束

- 框架无关：`src/` 不依赖 Vue，只产出纯数据 AST；`vue` 仅作为 peerDependency 为 VNode 输出消费方声明。
- 解析与输出分离：registry 只登记标签名和 TagMode，renderer 只登记 handler。新增标签 = 在 `tags.ts` 登记模式 + 在各预设补 handler；自定义 registry 不受默认表影响。
- 不可变：`register()` 返回新 registry，旧实例不变；renderer 创建后冻结。
- 安全：默认 HTML 预设负责文本、属性转义和 URL 协议白名单；自定义 handler 返回的字符串属于受信任代码，预设不约束。
- 容错优先：未知标签、未闭合标签、孤立结束标签、参数异常一律降级为纯文本，不抛错。
- 兼容旧站：标签模式、参数解析与表情规则移植自旧论坛 `Forum/Ubb/Core.tsx`，改动前先核对旧行为。
- 代码注释、提交说明、文档用中文。

## 文档规范

- 公共 API 或解析、渲染行为变化必须同步 `README.md` 与根 `ARCHITECTURE.md`；长期架构决策写根 `docs/adr/`。
- 复杂改动先在根 `docs/exec-plans/` 写执行计划。
