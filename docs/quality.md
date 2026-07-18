# 代码质量

提交代码前必须执行下面的命令确认代码质量在静态检查和动态测试层面上通过

## 静态检查

```bash
vp run ready # 全量构建 + vp check + Knip + 全量测试。任一失败就不能提交。
```

`vp check` 负责 format、lint 和类型检查。`apps/website` 使用 TypeScript 6，`packages/api`、`packages/ubb` 和 `packages/utils` 使用 TypeScript 7；版本边界和升级条件见 `docs/frontend.md` 的“TypeScript 工具链”。`vp run ready` 还会执行全量构建、Knip 和全量测试。Knip 检查未使用文件、导出和类型，未被入口引用的 Vue SFC 也会阻断提交。

`apps/docs` 的 VitePress 生产构建会检查站内死链并生成静态页面和站点地图。文档构建失败与应用构建失败同样会阻断 `vp run ready`。

## 动态测试

项目使用 Vitest 框架进行测试

### TDD 测试

如果需要进行 TDD 测试，有以下几项规定：

1. 禁止主 agent 同时编写测试和实现代码。应让另一个 agent（比方说派遣一个子 agent）去编写测试代码，然后由主 agent 进行实现。
2. 禁止为了通过测试而直接修改测试代码。如果确实需要修改测试代码，必须向开发者讲清原因。
3. 禁止编写显而易见的测试代码。值得测的是有分支、有状态、有边界的逻辑，比方说懒刷新的并发去重等。TDD 适合内部逻辑复杂、外部可观察的任务

### 端到端验证

需要用浏览器实际登录、点击、验证接口可达性时，先复用已在运行的 dev server，不要重复启动。

- 先运行 `PORTLESS_PORT=1355 PORTLESS_HTTPS=0 PORTLESS_SYNC_HOSTS=0 vp exec portless get cc98` 获取当前 worktree 的稳定地址，再用相同环境运行 `vp exec portless list`，或用 `curl` 判断路由是否已运行。
- 路由已运行就直接复用，不要新起实例。
- 路由未运行时执行 `vp run dev`。主 worktree 使用 `http://cc98.localhost:1355`，分支 worktree 使用 `http://<branch>.cc98.localhost:1355`，实际应用端口由 portless 分配。
- 验证完毕若自己启动了 server，负责关闭它，不留后台进程。

### 构建产物验证

需要确认生产构建的实际行为时运行 `vp run preview`。该命令会先执行 `vp run -r build`，再通过 Vite Preview 启动 `apps/website/dist`。主 worktree 使用 `http://cc98-preview.localhost:1355`，分支 worktree 使用 `http://<branch>.cc98-preview.localhost:1355`，实际应用端口由 portless 分配。

dev server 和 preview 使用不同路由，可以同时运行。验证生产构建时不能用 dev server 代替；验证完毕若自己启动了 preview，负责关闭它。

用户文档站分别使用 `vp run docs:dev` 和 `vp run docs:preview`。默认稳定地址是 `http://cc98-docs.localhost:1355` 和 `http://cc98-docs-preview.localhost:1355`，分支 worktree 会由 portless 加入分支前缀。验收时至少检查首页、一个深层链接、搜索、移动端目录、404 和明暗模式。

浏览器验证使用 `agent-browser`。执行前先读取项目 skill，再按任务类型加载对应说明：

```bash
agent-browser skills get core
agent-browser skills get dogfood # 系统性 QA、问题复现和证据采集时使用
```

当前先遵循以下规则：

- `vp run ready` 仍是提交前硬门槛，浏览器验证不能替代静态检查、Vitest 或构建。
- agent-browser 会话按 worktree 隔离，优先使用 `agent-browser session id --scope worktree --prefix cc98` 生成稳定会话名。
- 登录、路由、权限、真实接口、富内容渲染和用户交互发生变化时，需要补浏览器验证。
- 验证通过后，UI 状态使用截图记录；多步骤交互、时序问题和 bug 复现使用录屏记录。
- 演示录屏按用户行为设置有范围的停留时间，不把每一步写成相同的固定延迟；页面扫视、提示阅读和最终状态应比普通点击反馈停留更久。
- 截图、录屏和临时报告按任务分子目录写入 `.artifacts/browser/`，不提交到仓库。需要放进 PR 时再上传为 PR 附件。结构如下：
  ```
  .artifacts/browser/{YYYY-MM-DD-任务名}/
  ├── screenshots/   # PNG 截图
  ├── videos/        # WebM 录屏
  └── report.md      # 临时报告（如 dogfood 报告）
  ```
  任务名与 `docs/exec-plans/` 下的执行计划文件名对齐；无对应执行计划时用简短的任务描述。跑 dogfood 时把 `OUTPUT_DIR` 指向对应任务目录，不要用默认的 `./dogfood-output/`。
- 认证信息使用 `agent-browser` 的会话或认证存储，不把密码、Cookie、token 和 auth state 写进脚本或仓库。

### 回归测试

每当用户执行修复任务并验证测试无误后，可以针对性的补充回归测试。回归背景本身不代表必须新增测试。新增前先确认测试能保护外部行为、分支、状态或边界：

- 不直接复述声明式实现，例如单独断言 `z.string().nullable()` 接受 `null`。
- 多个标签或配置走同一条通用代码路径时，用模式契约和代表样本覆盖，不枚举“基础、空值、嵌套、大小写”的所有排列。
- 优先从公开入口或最终输出验证完整性，不重复断言内部对象键、函数引用和组件层级。

如果 bug 不适合自动化回归测试，应在相关复杂逻辑旁写明原因和边界，避免后续维护时误删

## 自动文档巡检

`.github/workflows/librarian.yml` 在北京时间每天 00:30 检查前一个完整自然日进入默认分支的提交，也支持手动指定日期补跑。没有提交或没有文档漂移时不创建 PR；发现漂移时，Codex 按 `.agents/agents/librarian.md` 生成 Markdown 补丁，通过 `vp run ready` 后由独立任务发起 PR。

Codex 通过 Action 的本地 Responses API proxy 访问项目现有 New API 服务。补丁生成任务只有仓库读权限，PR 任务不接收模型凭据。自动补丁只允许 Markdown，并拒绝修改 `.github/` 和 `.agents/`。需要同步代码、配置、图片或提示词时，Librarian 只报告缺口，由后续人工任务处理。

仓库需要在 GitHub Actions secrets 中配置 `NEWAPI_CODEX_TOKEN`。secret 只传给 `openai/codex-action` 的 `openai-api-key` 输入，用于向 `https://api.shellraining.xyz/v1/responses` 注入 bearer token，不能写成 job 级环境变量，也不能传给安装、构建和 PR 创建步骤。
