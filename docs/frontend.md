# 前端工程规范

适用于 `apps/*`。

## 技术栈

Vue 3.6 + Vite+（`vp` CLI）。构建 `vp build`，开发 `vp run website#dev`，预览 `vp preview`。

核心依赖（版本由 `pnpm-workspace.yaml` catalog 集中管理）：

- 框架：vue / vue-router / pinia / pinia-plugin-persistedstate
- 服务端状态：@tanstack/vue-query
- 无头组件：reka-ui（不引入 shadcn-vue，样式自写）
- 样式：unocss + @unocss/preset-attributify + @unocss/preset-typography
- 虚拟滚动：vue-virtual-scroller
- HTTP：ofetch
- 边界校验：zod
- 工具：@vueuse/core、@vueuse/integrations、dayjs、nanoid、clsx
- 内容：md-editor-v3（编辑）、markdown-it（渲染）、katex（公式）
- 媒体：aplayer、dplayer、hls.js（组件在 `src/components/media/`）
- 通信：@microsoft/signalr

新增依赖前先看 `docs/dependency.md`。

## 模块

bundler 模块解析。导入带 `.ts` 扩展名（`allowImportingTsExtensions: true`）。`.vue` 文件经 `vue-shims.d.ts` 声明模块。

## 状态与渲染

- 客户端状态（登录态、UI 状态、主题）走 Pinia。store 在 `src/stores/`。
- 服务端状态（帖子、楼层、版面、配置）走 @tanstack/vue-query。query/mutation 在 `src/api/queries.ts`，query key 在同文件集中管理。
- 两者不混：不要把 API 响应塞进 Pinia，也不要在 vue-query 里存 UI 状态。
- 持久化：登录态、主题等用 pinia-plugin-persistedstate；token 由 `lib/http.ts` 单独管（避免双写）。

## 样式

- UnoCSS 原子类为主，配置在 `uno.config.ts`。
- 设计 token（色板、间距）走 CSS 变量，定义在 `src/styles/global.css`，UnoCSS theme 映射到这些变量（`text-cc98-text` → `var(--cc98-color-text)`）。
- 暗色/节日主题：改 `<html data-theme data-theme-season>` 属性，不重新加载样式，不在组件里硬编码颜色。
- 无头组件（Reka UI）通过 `data-state` 等 attribute 写样式，用 UnoCSS 的 attributify 语法（`data-[state=open]:...`）。

## API 边界

- 所有外部数据进 `api/queries.ts` 时用 Zod schema parse（`api/schemas.ts`），parse 失败直接报错，不部分降级。
- HTTP 经 `lib/http.ts` 的 `apiFetch`（ofetch 实例），自动带 Bearer token，401 自动清 token。
- 不在组件里直接发请求，一律走 `api/queries.ts` 的 queryOptions。

## 性能

- 路由级懒加载（`() => import(...)`）
- 重依赖（KaTeX、APlayer/DPlayer、md-editor-v3）按需 import，不进主 bundle
- 长列表（楼层、主题列表）用 vue-virtual-scroller
- 热点组件（楼层渲染、Markdown 渲染）后续迁 Vapor Mode

## 与 packages 的关系

apps 只依赖 packages 的公共导出（dist），不直接 import packages 内部源文件路径。
