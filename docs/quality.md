# 代码质量

提交前必须通过的门槛。

## 强制命令

```
vp run ready
```

等价于 `vp check`（format + lint + typecheck）+ `vp run -r test` + `vp run -r build`。任一失败就不能提交。

pre-commit 钩子（`.vite-hooks/pre-commit`）跑 `vp staged` 处理暂存区。

## Lint 与 Format

经 vite-plus 调用 oxlint（type-aware）和 oxfmt，配置在 `vite.config.ts` 的 `lint` 段，违反规则会阻断提交。

新增自定义规则时，把修复指引直接写进报错信息里。

## 类型

TypeScript strict。`module: esnext`，`moduleResolution: bundler`，`noEmit`，`verbatimModuleSyntax`，`erasableSyntaxOnly`。

`.vue` 文件经 `vue-shims.d.ts` 声明模块，否则 tsc 报 TS2307。

## 测试

Vitest。`packages/*` 必须有测试（见 `packages/utils/tests/`）。`apps/*` 按需。

如果需要进行 TDD 测试，有以下几项规定：

1. 禁止主 agent 直接去写测试，禁止主 agent 同时编写测试和实现代码。应让另一个 agent（比方说派遣一个子 agent）去编写测试代码，然后由主 agent 进行实现。
2. 禁止为了通过测试而直接修改测试代码。如果确实需要修改测试代码，必须向开发者讲清原因。

## 结构约束

- 公共 API 必须有类型导出（`export type` / `export interface`）
- API 响应一律经 Zod schema parse（`api/schemas.ts`），不裸用 `any`
- query key 集中在 `api/queries.ts` 的 `queryKeys`，mutation 完成后 invalidate 相关 key
- HTTP 一律走 `lib/http.ts` 的 `apiFetch`，不在组件里直接 `fetch` / `ofetch`
- 客户端状态进 Pinia，服务端状态进 vue-query，不混用
- 组件里不硬编码颜色值，用 UnoCSS 语义 class（`text-cc98-*`）或 CSS 变量
- 路由级组件懒加载（`() => import(...)`）
- 重依赖（KaTeX、播放器、编辑器）按需 import，不进主 bundle
- 工具函数优先用 VueUse / dayjs / clsx / nanoid，不手写轮子
