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

TypeScript strict。`module: nodenext`，`moduleResolution: nodenext`，`noEmit`。

## 测试

Vitest。`packages/*` 必须有测试（见 `packages/utils/tests/`）。`apps/*` 按需。

如果需要进行 TDD 测试，有以下几项规定：

1. 禁止主 agent 直接去写测试，禁止主 agent 同时编写测试和实现代码。应让另一个 agent（比方说派遣一个子 agent）去编写测试代码，然后由主 agent 进行实现。
2. 禁止为了通过测试而直接修改测试代码。如果确实需要修改测试代码，必须向开发者讲清原因。

## 结构约束（未来引入时填充）

- 文件大小上限
- 复杂度上限
- 公共 API 必须有类型导出
- 命名约定（schema / type / hook 等）
