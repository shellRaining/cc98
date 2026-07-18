# 0003. Markdown 编辑与解析统一使用 remark 体系

Date: 2026-07-18
Status: Accepted

## 背景

网站原先使用 `md-editor-v3` 编辑 Markdown，阅读侧使用 `markdown-it` 生成 token，再映射到 Vue 与 `Universe*` 组件。两条链路使用不同的语法实现，编辑器能够产生的内容不一定能被阅读侧按相同规则解释，新增语法也需要分别确认。

Milkdown 以 ProseMirror 维护编辑态文档，并通过 remark 在 Markdown 与编辑态之间转换。前期构建试验中，`remark-parse + remark-gfm` 的 parse-only 入口小于原有 `markdown-it` 入口，统一 parser 不会因为包体积失去可行性。

## 决策

生产编辑器使用 Crepe Builder 和 feature 子路径按需组装 Milkdown，不使用 Crepe 的完整默认入口。当前组合启用常驻工具栏、选区菜单、斜杠菜单、链接浮层、列表、表格、基础 CodeMirror、LaTeX、占位符和光标能力。CodeMirror 只为代码块与公式块提供编辑能力，不加载完整语言数据包；AI 不进入写作链路。ImageBlock 会把标准 Markdown 图片的 alt 改写为宽高比，因此继续使用 CommonMark 图片节点和网站上传回调。

阅读侧使用 `remark-parse`、`remark-gfm` 和 `remark-math` 生成 MDAST，由 Vue renderer 直接映射到 HTML 元素与 `Universe*` 组件。行内公式和块公式复用 `UniverseMath`，统一交给 KaTeX 安全渲染。

仓库不再把 `markdown-it` 作为网站解析器，也不保留 `md-editor-v3`。编辑和阅读共享 CommonMark 与 GFM 语法边界，但各自维护适合当前职责的状态模型：Milkdown 管理 ProseMirror document，阅读侧消费只读 MDAST。

不受信任的原始 HTML 不转换为 DOM。MDAST 中的 HTML 节点按文本显示，链接和图片继续经过网站统一的 URL 安全入口。

## 备选

保留 `markdown-it` 作为阅读 parser，可以减少一次 renderer 改造，但会长期维护两套 Markdown 语法边界。这个方案不再采用。

只使用 Milkdown Kit 自建编辑器界面可以得到更小的写作 chunk，但常驻工具栏、选区菜单、节点菜单和视觉反馈都需要项目长期维护。首版实现证明基础功能可用，实际写作体验仍明显弱于迁移前的成熟编辑器，因此不再采用这一方案。

直接使用 Crepe 默认入口可以少写配置，但会把 CodeMirror 语言数据、KaTeX 编辑能力和当前不需要的 feature 带入同一入口。按 feature 子路径组合保留 Crepe 的产品层体验，同时避免这些默认能力进入构建产物。

阅读侧先生成 HTML 字符串再交给 Vue，组件复用和 URL 安全检查会变得间接，还需要额外的 HTML 清洗。直接渲染 MDAST 更符合现有富内容架构。

## 后果

编辑与阅读使用同一组 Markdown 语法，表格、删除线、任务列表、自动链接、引用链接和脚注可以在同一套测试中约束。编辑器继续按写作路由懒加载，阅读页面不加载 ProseMirror 或 Crepe。

包含基础 CodeMirror 与 LaTeX 的 Crepe 组合相对基础 Milkdown Kit 让写作路由增加约 211.42 kB gzip，其中 JavaScript 增加 196.49 kB、CSS 增加 14.93 kB；当前写作 JavaScript chunk 为 303.43 kB gzip。CodeMirror 与 LaTeX 相对不含公式的 Crepe 组合增加 129.90 kB gzip。这个成本不进入普通阅读入口，并换取常驻图标工具栏、选区菜单、中文斜杠菜单、代码块编辑和公式实时预览。

项目需要维护一层 MDAST 到 Vue 的显式节点映射。remark 或 Milkdown 升级时，要检查语法树类型、Markdown 序列化变化和构建体积。新增 Markdown 扩展前需要同时确认 Milkdown preset 和阅读 renderer 是否支持。
