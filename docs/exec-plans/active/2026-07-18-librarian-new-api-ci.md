# Librarian New API CI 接入

> 状态：实施中。需要把执行计划收尾规则和每日文档巡检迁入独立分支，使用现有 New API Responses 服务完成 GitHub Actions 真实验证。

## 背景

项目的复杂任务偶尔会完成实现和验证，却没有更新执行计划、归档文件和索引。仓库还缺少按日检查主分支提交、修正文档漂移并发起 PR 的自动化。

本机 Codex 已通过 `https://api.shellraining.xyz/v1` 使用 `gpt-5.6-sol-fast`，服务兼容 Responses API。GitHub Actions 可以继续运行 Codex Agent，把 New API bearer token 交给 `openai/codex-action` 的本地安全代理，不需要 OpenAI 官方 API key。

## 目标

- 把执行计划生命周期检查加入 agent 收尾规则。
- 新增每日 Librarian 提示词和 GitHub Actions 工作流。
- 每天按北京时间检查前一个完整自然日，没有提交或没有漂移时不创建 PR。
- 使用 New API Responses endpoint 和仓库 secret 运行 Codex，不把 token 写入仓库或日志。
- 在远端分支实际运行工作流，验证 Codex、补丁限制、质量门禁和 PR 创建链路。

## 非目标

- 不自动合并 Librarian PR。
- 不允许 Librarian 修改非 Markdown、`.github/` 或 `.agents/`。
- 不把本机 Codex 配置文件和静态 bearer token 提交到仓库。

## 方案

GitHub Actions 把 New API token 通过 `openai-api-key` 输入交给 Codex Responses API proxy，同时把 `responses-api-endpoint` 指向 `https://api.shellraining.xyz/v1/responses`。该输入名沿用 Action 契约，值来自自定义服务，不是 OpenAI 官方 key。

补丁生成任务只有仓库读权限。它运行 Codex 后先检查文件白名单，再执行 `vp run ready`，最后上传 patch。独立任务在不接收 New API token 的情况下应用 patch、创建分支并发起 PR。

分支验证期间临时增加仅匹配当前测试分支的 `push` 触发。验证完成后删除该触发，再提交最终工作流。

## 实施步骤

- [x] 补充 agent 收尾规则和执行计划完成定义。
- [x] 编写 Librarian 提示词与质量文档。
- [x] 新增使用 New API Responses endpoint 的 GitHub Actions 工作流。
- [x] 通过本地 YAML、shell、标点和 `vp run ready` 验证。
- [ ] 配置 GitHub Actions secret，推送测试分支并观察真实运行。
- [ ] 修复远端问题，确认 Librarian 能生成补丁和 PR。
- [ ] 删除临时测试触发，完成最终验证并归档本计划。

## 验证

- workflow YAML 可以解析，所有 `run` block 通过 `bash -n`。
- New API token 只进入 Codex Action 的安全代理步骤。
- Codex 任务无仓库写权限，PR 任务不接收模型凭据。
- 无提交、无漂移和有补丁三条分支都有确定行为。
- 本地 `vp run ready` 和远端工作流均通过。

本地验证结果：

- Ruby Psych 成功解析 workflow YAML，7 个 `run` shell block 均通过 `bash -n`。
- `AGENTS.md`、执行计划规则、质量文档、Librarian 提示词和本计划通过 write skill 中文标点门禁。
- `git diff --check` 和 `vp run ready` 通过，覆盖构建、format、lint、类型检查、Knip 与 484 个测试。

## 进展与调整

- 2026-07-18：创建 `codex/librarian-new-api-ci` 分支 worktree，基于 `main` 完成依赖安装。
- 2026-07-18：确认本机 New API provider 使用 Responses API，GitHub 侧只需新增加密 secret，不提交本机 `config.toml`。
- 2026-07-18：对照原工作区中尚未提交的每日文档巡检实现，复用收尾规则、生命周期定义、权限隔离和补丁白名单；Apifox 与开发环境计划等无关修改没有迁入当前分支。
- 2026-07-18：核对 `openai/codex-action@v1` 的 action 定义，确认它支持自定义 `responses-api-endpoint` 和 `model`，且 bearer token 只进入本地 Responses API proxy。
- 2026-07-18：完成本地 YAML、shell、标点和全量质量门禁验证。新 worktree 首次直接运行 `vp check` 时缺少内部包构建产物，`vp run ready` 按任务顺序先构建内部包后全部通过，GitHub workflow 使用相同顺序。
- 2026-07-18：首次远端运行成功调用 New API 上的 Codex，生成的补丁通过 Markdown 白名单，正确更新 API README、归档开发环境计划并保留尚未完成的 Librarian 计划。质量门禁因索引表格尚未经过 Oxfmt 而失败，工作流改为只格式化候选 Markdown 后再执行 `vp run ready`，并把删除文件纳入路径白名单检查。

## 决策记录

- 使用 Codex Action 自带的 Responses API proxy 隔离 bearer token，不在 runner 中生成包含明文 token 的 Codex 配置。
- 定时任务在北京时间 00:30 检查前一个完整自然日，避免漏掉当天最后一段提交。
