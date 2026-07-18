# 协作规范

## 分支模型

`main` 是可发布主线。分支名使用 `<type>/<short-desc>`，前缀按任务意图选择：功能使用 `feature/`，修复使用 `fix/`，文档使用 `docs/`，重构使用 `refactor/`，性能优化使用 `perf/`，测试使用 `test/`，工程维护使用 `chore/`，CI 使用 `ci/`。`short-desc` 使用简短的英文短横线命名，例如 `fix/avatar-mixed-content`、`docs/worktree-branch-naming`。不要用 Agent、开发者或工具名称作为固定前缀。

远端 `main` 是线上状态的唯一置信源。Agent 不直接向 `main` 推送或合入代码；所有改动都必须先进入独立分支并创建 PR，由开发者完成 review 并明确决定是否合入。

分支合入统一使用 squash，不保留任务实施过程中产生的探索、修复和整理提交。同一任务在进入 `main` 时只保留一个逻辑提交，由开发者在 review 后执行合入。

实施过程中发现但不属于当前交付范围的问题，Agent 只向开发者反馈，不擅自扩展提交，也不自行写入项目文档；是否修复、记录或另开任务由开发者决定。

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

## 用户文档同步

修改用户可见流程、权限条件、界面名称、错误处理或核心规则时，需要检查 `apps/docs/content/` 中的对应页面。行为和文档应在同一个改动中更新，不能等发布后再补。

新增文档页面后，按需补充 `apps/docs/.vitepress/config.ts` 中的侧栏和导航。构建会检查站内链接是否存在。开发者准则、ADR 和执行计划继续放在根目录 `docs/`，不复制到用户帮助站。

公共贡献的完整流程见根目录 `CONTRIBUTING.md`，社区交流遵循 `CODE_OF_CONDUCT.md`，漏洞和隐私问题按 `SECURITY.md` 使用私密渠道报告。
