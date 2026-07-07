# 协作规范

## 分支模型

`main` 是可发布主线。feature 分支命名 `feature/<short-desc>`，修复 `fix/<issue-or-desc>`。

不直接推 main，走 PR。

## 提交

提交信息一行摘要，祈使语气。例：`add user avatar upload`。

复杂改动追加正文，空行分隔，说做了什么和为什么，不必贴实现过程。

## PR

- 标题清晰描述意图
- 关联 issue（如有）
- 自检清单：
  - `vp run ready` 通过
  - 公共 API 改动已同步 `docs/`
  - 新增依赖已在 `docs/dependency.md` 原则内
  - 测试覆盖关键路径
- agent 生成的 PR 同样走这套规范

## Review

优先 agent-to-agent review。人类 review 关注：

- 是否符合 `ARCHITECTURE.md` 的分层边界
- 是否符合 `docs/core-beliefs.md` 的约束
- 是否有文档未同步

## 文档同步

改公共 API、改架构边界、改核心约束，必须同次更新对应 `docs/`。CI 会校验断链。
