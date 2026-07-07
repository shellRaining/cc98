# 架构

本仓库是 Vite+ monorepo，使用 pnpm workspace。

## 模块布局

```
apps/website      面向用户的 Web 应用（Vite + TypeScript）
packages/utils    可复用 TypeScript 库
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

## 技术栈

- 包管理：pnpm 11 + workspace catalog
- 构建工具：Vite+（`vp` CLI）
- 语言：TypeScript（`module: nodenext`）
- Lint / Format：oxlint + oxfmt（经 vite-plus，type-aware）
- 测试：Vitest
- Pre-commit：`.vite-hooks/pre-commit` → `vp staged`

## 演进

架构决策记录在 `docs/adr/`。重大变更先写一条 ADR，再动代码。
