# CC98 帮助中心

`apps/docs` 是面向论坛用户的 VitePress 静态站。正文放在 `content/`，站点标题、导航和侧栏放在 `.vitepress/config.ts`。页面使用 VitePress 默认主题，不维护自定义样式。

## 本地开发

在仓库根目录运行：

```bash
vp run docs:dev
```

生产预览使用 `vp run docs:preview`。也可以直接运行 `vp run docs#build`，产物位于 `apps/docs/dist`。

## 发布配置

站点按独立域名和根路径构建。`DOCS_SITE_URL` 用于生成站点地图，默认值是 `https://cc98-docs.vercel.app`。主站帮助入口可通过 `VITE_CC98_DOCS_URL` 覆盖。

Vercel 项目 `cc98-docs` 的根目录是 `apps/docs`，构建配置放在 `vercel.json`。`ignoreCommand` 会在文档内容、配置、静态资源和相关依赖都没有变化时跳过部署。PR 会生成独立预览，`main` 分支发布到 `https://cc98-docs.vercel.app`。
