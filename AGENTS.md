# CC98 论坛

agent-first 工作流：人设计环境和意图，agent 执行。这份文件是目录（TOC），不是百科全书，深度内容在 docs/ 下，按需加载，省 context。

## 常用命令

- `vp install`：拉完远程变更先跑
- `vp run ready`：format + lint + typecheck + test + build，提交前必跑（等价 `vp check` + `vp run -r test` + `vp run -r build`）
- `vp check`：format + lint + typecheck，改完文件立即跑（增量检查，见 `docs/quality.md` 增量检查小节）
- `vp run dev`：启动 apps/website 开发服务器。浏览器 E2E 前先探测 5173 是否已运行，复用不新起，见 `docs/quality.md` 端到端验证小节

## 何时读什么

开工前：

- `ARCHITECTURE.md`：顶层架构地图和分层边界
- `docs/collaborating.md`：分支、提交、PR、Review、文档同步

收尾前：

- `docs/quality.md`：代码质量门槛（lint / 类型 / 测试）

按需：

- `docs/frontend.md`：前端工程规范
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

### 代码规范

- 工具函数优先用 VueUse / dayjs / clsx / nanoid，不手写轮子
- 复杂工作先写执行计划，不在 chat 里堆上下文
- 工具函数和复杂逻辑处可以编写一定数量的注释，但禁止对显而易见的逻辑给出注释解释

### 文档规范

- `docs/` 目录下的一级文档是项目的准则知识，只存放与实际实现浅相关的内容，agent 不要擅自创建，认为有必要时可以询问用户
- 文档和代码同源：改公共 API、架构边界、核心约束，**必须**同步更新对应 `docs/`
- 写文档前先用 write skill（`.agents/skills/write`），避免 AI 味文案
- 项目中凡是涉及到架构图的地方，必须使用 Mermaid，不要使用 ASCII 字符图
