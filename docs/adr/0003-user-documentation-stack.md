# ADR 0003：用户文档站使用 VitePress

## 状态

已接受，2026-07-20。

## 背景

用户帮助需要独立导航、搜索、深层链接、静态发布和主站入口。站点内容以 Markdown 为主，没有定制交互和视觉体系的需求。

项目当前使用 Vite 8。VitePress 2 与现有 Vite、Vue 和 VueUse 版本一致，可以直接提供默认主题、本地搜索、侧栏、目录、死链检查、站点地图和静态构建。

## 决策

`apps/docs` 使用 VitePress 2 和默认主题。站点只维护必要的标题、导航、侧栏和中文界面文案，不新增主题覆盖、页面组件或自定义样式。

Markdown 正文放在 `apps/docs/content`，站点配置放在 `apps/docs/.vitepress/config.ts`。站点按独立域名和根路径发布，主站只保留可配置的帮助链接，不导入文档应用源码。

文档站使用独立的 Vercel 项目 `cc98-docs`。项目根目录设为 `apps/docs`，PR 自动生成预览，`main` 分支发布到稳定的 `vercel.app` 域名。文档部署不复用主站的 Vercel 项目。

## 影响

- 导航、搜索、目录、亮暗模式和静态页面由 VitePress 维护。
- 文档构建会检查站内死链并生成站点地图。
- 文档站使用 VitePress 自带的 Markdown 处理和默认主题，不维护独立视觉系统。
- 文档站和主站拥有独立的 Vercel 构建、预览地址和回滚记录。
- VitePress 2 仍处于 alpha 阶段，升级时需要运行完整构建和浏览器检查。
