# 架构

本仓库是 Vite+ monorepo，使用 pnpm workspace。复刻浙江大学 CC98 论坛前端。

## 模块布局

```
apps/website              面向用户的 Web 应用（Vue 3.6 SPA）
packages/utils            可复用 TypeScript 工具
packages/ubb              UBB 渲染器（只读）+ UBB→Markdown 转换器
```

## 分层与依赖方向

允许的依赖方向（左侧可依赖右侧）：

```
apps/*        → packages/*
packages/*    → packages/*（同名域内）
packages/*    → 外部依赖
```

禁止：

- `apps/*` 之间互相 import（如 website 直接 import 另一个 app）
- `apps/*` 反向被 `packages/*` 依赖

横切关注点（auth / telemetry / feature flags 等）走单一显式入口接入，引入时在本文档登记。

已登记入口：

- 日志：`apps/website/src/lib/logger.ts`。当前基于 pino browser 输出到浏览器 console；后续远端上报、脱敏、采样等能力都在该入口扩展。

## apps/website 内部分层

```
src/
  api/        Zod schema + vue-query queryOptions（API 边界）
  lib/        ofetch 客户端、vue-query 装配（基础设施）
  stores/     Pinia：user（登录态）、theme（主题）
  router/     Vue Router 路由表
  layouts/    页面壳（DefaultLayout）
  components/ 通用组件（AppHeader / AppFooter / ...）
  views/      路由级页面（HomeView / TopicView / ...）
  styles/     全局 CSS + CSS 变量（light/dark）
```

数据流：`api/queries.ts`（vue-query）→ `views/*`（消费）→ `components/*`（展示）。客户端状态走 Pinia，服务端状态走 vue-query，两者不混。

## 技术栈

- 包管理：pnpm 11 + workspace catalog（`pnpm-workspace.yaml`）
- 构建：Vite+（`vp` CLI，底层 Vite + Rolldown）
- 框架：Vue 3.6（beta，vapor 组件 opt-in）
- 状态：Pinia（客户端）+ @tanstack/vue-query（服务端）
- 路由：Vue Router 5
- 组件：Reka UI（无头）+ UnoCSS（原子 CSS）
- 语言：TypeScript strict
- Lint / Format：oxlint（type-aware）+ oxfmt（经 vite-plus）
- 测试：Vitest
- Pre-commit：`.vite-hooks/pre-commit` → `vp staged`

技术选型理由见 `docs/adr/0001-tech-stack.md`。

## 演进

架构决策记录在 `docs/adr/`。重大变更先写一条 ADR，再动代码。
