# 协作规范

## 分支模型

`main` 是可发布主线。feature 分支命名 `feature/<short-desc>`，修复 `fix/<issue-or-desc>`。

不直接推 main，走 PR。

## 提交

使用 Conventional Commits，格式 `<type>(<scope>): <摘要>`。type 必填（英文小写），scope 可选，摘要正文用中文，不加句号。

type 清单：

- `feat`：新功能
- `fix`：bug 修复
- `docs`：文档改动
- `refactor`：重构，不改变外部行为
- `perf`：性能优化
- `test`：测试相关
- `chore`：构建、依赖、脚手架等杂项
- `style`：格式调整，不影响代码逻辑
- `ci`：CI 配置
- `revert`：回滚

例：`feat(auth): 加入 OIDC token 刷新`、`docs: 更新技术选型 ADR`、`fix(router): 修复帖子页锚点跳转`。

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
