# ubb-core 子包

agent-first 工作流：本文件是进入 `packages/ubb` 的目录（TOC），不是百科全书。深度内容在各源码文件头部注释、`README.md` 与 `ARCHITECTURE.md` 中，按需加载，省 context。

## 定位

框架无关的 UBB 解析与输出工具。注册器定义标签和参数解析方式，泛型 renderer 把 AST 转成调用方选择的输出类型；CC98 规则和 HTML、Markdown 预设按需导入。只读解析，不做编辑器。

## 常用命令

- `vp run ubb-core#test`：运行本包测试
- `vp run ubb-core#build`：构建 `dist/`，改了公共导出后必跑
- `vp run ubb-core#bench`：解析器性能基准；`bench:large` 为大数据量基准
- `vp run ubb-core#check`：格式、lint、类型检查
- 全仓提交前跑根目录 `vp run ready`

## 何时读什么

开工前：

- `README.md`：公共 API 用法、handler 参数与四种标签模式说明
- `ARCHITECTURE.md`：模块布局、数据流与关键设计
- `src/index.ts`：公共导出清单

按需：

- `cc98/tags.ts`：静态标签模式表与表情标签族（em/ac/ms/mahjong/cc98/tb）
- `src/parser.ts`：解析容错行为（未闭合、孤立结束、未知标签降级规则）
- `src/registry.ts`、`src/renderer.ts`：注册与遍历核心，handler 的惰性 `content`、`textContent`、`context`、`renderNodes(nodes)`
- `src/tag-data.ts`：简单标签头参数规则；`cc98/tag-data.ts`：旧论坛 tokenizer（逗号、等号、引号规则），对外导出为 `parseCc98Tag`
- `cc98/html.ts`、`cc98/markdown.ts`：CC98 规则的两个字符串预设，从 `ubb-core/cc98/html`、`ubb-core/cc98/markdown` 导入（转义与 URL 白名单在 HTML 预设）
- `cc98/emotion.ts`：表情资源 URL 与编号规则
- `conformance/`：跨语言一致性语料（ubb-rs、ubb-go、ubb-dotnet 三个仓库共用），行为规范与再生成流程见 `conformance/README.md`
- `tests/`：行为契约；`bench/`：性能基线

## 核心约束

- 框架无关：`src/` 与 `cc98/` 不导入任何外部包，只产出纯数据 AST；VNode 等框架输出由消费方用泛型 renderer 自行实现，本包不声明框架依赖。
- 解析与输出分离：registry 登记标签名、UbbTagMode 和可选的参数解析函数，renderer 登记 handler。根入口不依赖 CC98；CC98 规则在 `cc98/`，预设补 handler 后才改变输出。
- 不可变：`register()` 返回新 registry，旧实例不变；renderer 创建后冻结。
- 安全：默认 HTML 预设负责文本、属性转义和 URL 协议白名单；自定义 handler 返回的字符串属于受信任代码，预设不约束。
- 容错优先：未知标签、未闭合标签、孤立结束标签、参数异常一律降级为纯文本，不抛错。
- 兼容旧站：标签模式、参数解析与表情规则移植自旧论坛 `Forum/Ubb/Core.tsx`，改动前先核对旧行为。
- 行为变更先改语料：修改解析或渲染行为时，先在 `conformance/generate.ts` 更新用例、重新生成并 bump `specVersion`，再同步 ubb-rs、ubb-go、ubb-dotnet 三个仓库的语料副本。
- 代码注释、提交说明、文档用中文。

## 文档规范

- 公共 API 或解析、渲染行为变化必须同步 `README.md` 与根 `ARCHITECTURE.md`；长期架构决策写根 `docs/adr/`。
- 复杂改动先在根 `docs/exec-plans/` 写执行计划。
