# CC98 论坛

agent-first 工作流：人设计环境和意图，agent 执行。这份文件是目录（TOC），不是百科全书，深度内容在 docs/ 下，按需加载，省 context。

## 常用命令

- `vp install`：拉完远程变更或进入新 worktree 后运行；Worktrunk 创建 worktree 时会自动执行
- `vp run ready`：format + lint + typecheck + test + build，提交前必跑（等价 `vp check` + `vp run -r test` + `vp run -r build`）
- `vp check`：format + lint + typecheck，改完文件立即跑（增量检查，见 `docs/quality.md` 增量检查小节）
- `vp run dev`：统一开发入口，通过 portless 提供稳定地址，见 `docs/quality.md` 端到端验证小节
- `vp run preview`：构建并预览生产产物，通过 portless 提供独立稳定地址
- `vp run docs:dev`：启动用户文档站，通过 portless 提供独立稳定地址
- `vp run docs:preview`：构建并预览用户文档站生产产物

需要隔离开发时，当前 Agent 使用 `wt switch --create codex/<task-name> --base=@ --no-cd --format json` 创建真实分支 worktree，读取返回的 `path`，后续所有命令和文件编辑都定向到该目录。不要使用 `-x codex` 启动另一个 Agent。新 worktree 不包含当前目录未提交的改动，任务依赖这些改动时继续使用当前目录。

## 何时读什么

开工前：

- `ARCHITECTURE.md`：顶层架构地图和分层边界
- `docs/collaborating.md`：分支、提交、PR、Review、文档同步

收尾前：

- `docs/quality.md`：代码质量门槛（lint / 类型 / 测试）
- 如果任务关联 `docs/exec-plans/active/` 中的计划，逐项核对目标、实施步骤和验证记录。交付物和必要验证全部完成后，补齐结果与遗留项，移入 `completed/` 并同步索引；仍有明确交付物时更新当前进展，继续留在 `active/`，不能只在最终回复里宣告完成

按需：

- `docs/frontend.md`：前端工程规范
- `apps/docs/README.md`：用户文档站的内容、构建和发布约定
- `DESIGN.md`：设计语言与视觉 token（根目录，遵循 Google DESIGN.md 规范）
- `docs/security.md`：应用安全（XSS / CSRF / auth / secrets）
- `docs/dependency.md`：依赖和供应链安全
- `docs/adr/`：架构决策记录，遇到重大架构抉择时写一条
- `docs/exec-plans/README.md`：执行计划索引和生命周期规则
- `docs/exec-plans/active/`：正在推进的复杂改动。开工前先查是否有相关计划，复杂改动时参考模板新写一份
- `docs/exec-plans/completed/`：已完成计划和历史迁移记录，只在追溯背景或复用决策时读取

后端 / 数据库规范暂未建立，本项目目前无后端。要引入薄 API wrapper 层时，先建 `docs/backend.md` 和 `docs/database.md`，再补进上面这张表。

## 核心约束

- 项目语言用中文：commit message、文档、用户可见文案、代码注释一律中文（type 前缀如 `feat:` 是英文，摘要正文中文）
- 每当用户指正你的一些做法不对的时候，你就要思考这些是否能够作为一些高层次的观点更新到项目文档中。如果你认为有必要，可以征求用户的意见进行更新
- 项目偏好清晰、简洁、优雅的实现，兼顾性能与用户体验，反对过度设计与小题大做
- 开发脚手架优先使用工具的声明式配置和原生命令；只有标准配置无法表达必要逻辑时才新增脚本
- Vite+ 是项目内唯一的 Node.js 入口：终端直接运行 Node 脚本时使用 `vp node`，workspace 任务使用 `vp run`，本地 CLI 使用 `vp exec`，包管理使用 `vp install` 或 `vp pm`；隔离的其他包管理器兼容测试使用 `vp env exec <包管理器>`。`vp run` 管理的 package script 内可直接调用 `node`。不要要求用户执行会接管全局 PATH 的 `vp env setup`

### 代码规范

- 工具函数优先用 VueUse / dayjs / clsx / nanoid，不手写轮子
- 复杂工作先写执行计划，不在 chat 里堆上下文
- 工具函数和复杂逻辑处可以编写一定数量的注释，但禁止对显而易见的逻辑给出注释解释

### 文档规范

- `docs/` 目录下的一级文档是项目的准则知识，只存放与实际实现浅相关的内容，agent 不要擅自创建，认为有必要时可以询问用户
- 文档和代码同源：改公共 API、架构边界、核心约束，**必须**同步更新对应 `docs/`
- 写文档前先用 write skill（`.agents/skills/write`），避免 AI 味文案
- 修改用户可见流程、权限、界面名称或核心规则时，检查 `apps/docs/content/` 中的对应说明
- 项目中凡是涉及到架构图的地方，必须使用 Mermaid，不要使用 ASCII 字符图
