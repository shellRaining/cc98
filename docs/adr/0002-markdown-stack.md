# 0002. Markdown 编辑与解析统一使用 remark 体系

Date: 2026-07-18
Status: Accepted

## 背景

网站原先使用 `md-editor-v3` 编辑 Markdown，阅读侧使用 `markdown-it` 生成 token，再映射到 Vue 与 `Universe*` 组件。两条链路使用不同的语法实现，编辑器能够产生的内容不一定能被阅读侧按相同规则解释，新增语法也需要分别确认。

Milkdown 以 ProseMirror 维护编辑态文档，并通过 remark 在 Markdown 与编辑态之间转换。前期构建试验中，`remark-parse + remark-gfm` 的 parse-only 入口小于原有 `markdown-it` 入口，统一 parser 不会因为包体积失去可行性。

## 决策

生产编辑器使用按需组装的 Milkdown Kit，不引入 Crepe 完整入口。阅读侧使用 `remark-parse` 和 `remark-gfm` 生成 MDAST，由 Vue renderer 直接映射到 HTML 元素与 `Universe*` 组件。

仓库不再把 `markdown-it` 作为网站解析器，也不保留 `md-editor-v3`。编辑和阅读共享 CommonMark 与 GFM 语法边界，但各自维护适合当前职责的状态模型：Milkdown 管理 ProseMirror document，阅读侧消费只读 MDAST。

不受信任的原始 HTML 不转换为 DOM。MDAST 中的 HTML 节点按文本显示，链接和图片继续经过网站统一的 URL 安全入口。

## 备选

保留 `markdown-it` 作为阅读 parser，可以减少一次 renderer 改造，但会长期维护两套 Markdown 语法边界。这个方案不再采用。

使用 Crepe 可以快速得到完整编辑器界面，但会引入默认 UI、CodeMirror 语言数据和 KaTeX 等本次不需要的能力。编辑器改为直接组合 Milkdown Kit 的 CommonMark、GFM、history、listener 和 upload。

阅读侧先生成 HTML 字符串再交给 Vue，组件复用和 URL 安全检查会变得间接，还需要额外的 HTML 清洗。直接渲染 MDAST 更符合现有富内容架构。

## 后果

编辑与阅读使用同一组 Markdown 语法，表格、删除线、任务列表、自动链接、引用链接和脚注可以在同一套测试中约束。编辑器继续按写作路由懒加载，阅读页面不加载 ProseMirror。

项目需要维护一层 MDAST 到 Vue 的显式节点映射。remark 或 Milkdown 升级时，要检查语法树类型、Markdown 序列化变化和构建体积。新增 Markdown 扩展前需要同时确认 Milkdown preset 和阅读 renderer 是否支持。
