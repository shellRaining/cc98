# 参与贡献

感谢参与 CC98 前端和公共契约维护。提交改动前请先阅读 `AGENTS.md`、`ARCHITECTURE.md` 与 `docs/collaborating.md`，再按改动范围阅读前端、安全、依赖或执行计划文档。

## 开发流程

1. 运行 `vp install` 安装 workspace 依赖。
2. 复杂改动先在 `docs/exec-plans/active/` 建立执行计划，小修复可以直接实施。
3. 修改文件后运行 `vp check`，提交前运行 `vp run ready`。
4. 提交使用 Conventional Commits，摘要正文用中文。

需要隔离开发时，使用项目在 `AGENTS.md` 中约定的 Worktrunk 命令创建真实分支 worktree。

## API 契约

`packages/api/src/schemas/` 和 `packages/api/src/operations/` 是 API 事实源。修改契约后运行：

```bash
vp run @cc98/api#generate
vp run @cc98/api#test
vp run @cc98/api#pack:check
```

不要直接修改生成的 OpenAPI、接口目录、Apifox 投影或静态文档来掩盖源码问题。新增真实响应 fixture 前必须脱敏，账号、密码、token、IP、私信和其他个人数据不能进入提交。

## Pull Request

PR 说明应写清用户可见变化、契约兼容性、验证命令和仍未解决的问题。改动公共 API、架构边界或核心约束时，同步更新对应文档。计划已经验收后，补齐结果与验证记录并移入 `completed/`。
