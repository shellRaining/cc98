# 开发环境与 Worktree 启动契约

> 状态：已完成。外部分支 worktree、依赖安装、稳定域名和本地凭证复制均已验证；pnpm Global Virtual Store 因 Vite+ 原生绑定不兼容而回退。

## 背景

Git worktree 只隔离源码、索引和分支状态，不会自动准备依赖、环境变量、浏览器、登录状态、端口和外部 CLI。Codex App 原生 worktree 还默认使用 detached HEAD，普通分支工具无法可靠识别任务名称，portless 也无法自动生成不同的 worktree 前缀。

本项目改用 Worktrunk 创建真实分支 worktree。当前 Agent 读取 Worktrunk 返回的目录，把后续命令和文件编辑定向到该 worktree。依赖安装、环境诊断和多 worktree 开发尽量使用工具的原生命令与声明式配置，不为简单的命令组合维护仓库脚本。

```mermaid
flowchart LR
  User["用户或 Agent"] --> Worktrunk["Worktrunk 创建分支 worktree"]
  Worktrunk --> Copy["复制白名单内的本地文件"]
  Copy --> Install["vp install"]
  Install --> Agent["当前 Agent 使用返回的目录"]
  Agent --> Dev["vp run dev"]
  Dev --> Portless["portless 分配随机端口和稳定域名"]
```

## 目标

- 新 worktree 通过 pnpm 与 Vite+ 的标准安装命令完成非交互初始化。
- Agent 使用各工具的标准诊断命令判断当前环境是否具备开发和验证条件。
- Node.js 工具由仓库固定版本，项目命令不依赖用户当前激活的 fnm、nvm 或系统 Node.js。
- 多个 worktree 可以同时启动网站，拥有不同监听端口和稳定访问地址。
- 当前 Agent 可以创建并使用真实分支 worktree，不依赖原生 detached HEAD worktree。
- CC98 本地凭证可以复制到 worktree，但不能进入 Git 或出现在诊断输出中。
- 普通开发、离线质量检查和外部账号验证保持分离。

## 非目标

- 不为每次提交构建开发镜像。
- 不引入 Docker、devcontainer、Nix、devenv 或 mise。
- 不自动执行 CC98 登录、Apifox 登录或其他需要用户确认的认证操作。
- 不把 Apifox 云端同步、真实 CC98 探测或浏览器 E2E 加入 `vp run ready`。
- 不把当前目录尚未提交的改动自动迁移到新 worktree。

## 环境声明

宿主机需要 Git、curl、全局 Vite+ 和 Worktrunk。Worktrunk 是“宿主机只保留 Vite+ 和系统基础工具”的明确例外，因为仓库内依赖无法在 worktree 创建前运行。

根 `package.json` 固定以下开发版本：

| 工具          | 版本      | 位置                         |
| ------------- | --------- | ---------------------------- |
| Node.js       | `24.18.0` | `devEngines.runtime`         |
| pnpm          | `11.10.0` | `devEngines.packageManager`  |
| Vite+         | `0.2.4`   | workspace catalog            |
| agent-browser | `0.32.2`  | 根 devDependency             |
| portless      | `0.15.4`  | 根 devDependency             |
| Apifox CLI    | `2.2.7`   | `packages/api` devDependency |
| Worktrunk     | `0.68.0`  | 当前验证过的宿主机版本       |

`engines.node` 继续描述项目支持范围，开发时由 `devEngines.runtime` 固定 Node.js。agent-browser 的安装脚本已经审计并加入 pnpm 构建白名单；Apifox CLI 带来的数据库驱动和 SSH 原生脚本不属于当前能力范围，明确设置为不执行。

“Vite+ 是唯一 Node.js 宿主”只约束本项目的命令入口：终端直接运行 Node 脚本时使用 `vp node`，workspace 任务使用 `vp run`，本地 CLI 使用 `vp exec`，包管理使用 `vp install` 或 `vp pm`。`vp run` 管理的 package script 已处于 Vite+ 运行时中，可以直接调用 `node`。项目不执行 `vp env setup`，因为该命令会在用户级 `VP_HOME/bin` 创建 shim，并通过 PATH 接管其他目录中的 `node`、`npm` 和包管理器命令。开发者仍可在其他项目继续使用 fnm、nvm 或系统 Node.js。

## 初始化与诊断

进入新 checkout 或 worktree 后运行：

```bash
vp install --frozen-lockfile --prefer-offline
```

根 `prepare` 会执行 `vp config`，因此不需要再包装一层初始化脚本。agent-browser 的浏览器运行环境按需准备，避免每个 worktree 都重复检查或下载共享 Chrome：

```bash
vp exec agent-browser doctor
vp exec agent-browser install
```

环境诊断直接使用各工具的标准命令，不提供聚合式 doctor：

```bash
vp env current
vp env which node
vp env which pnpm
vp exec agent-browser doctor
PORTLESS_PORT=1355 PORTLESS_HTTPS=0 PORTLESS_SYNC_HOSTS=0 vp exec portless doctor
wt config show
wt list
vp exec -F @cc98/api apifox --help
```

这些命令不读取本地凭证。缺少 portless 路由、Apifox 登录或 CC98 凭证不影响普通开发和离线质量检查。

## Worktrunk 工作流

项目配置位于 `.config/wt.toml`。Worktrunk 创建新 worktree 后按顺序运行：

1. `wt step copy-ignored --require-include`
2. `vp install --frozen-lockfile --prefer-offline`

项目 hook 第一次运行需要用户批准，审批保存在 Worktrunk 用户配置中。项目不安装 shell 集成，命令行和 Agent 可以直接调用 `wt`。

当前 Agent 创建 worktree：

```bash
wt switch --create <type>/<short-desc> --base=@ --no-cd --format json
```

分支名遵循 `docs/collaborating.md` 的语义化前缀规范。`--format json` 返回 worktree 的绝对路径，`--no-cd` 避免误以为子进程能够修改当前 Agent 的工作目录。Agent 读取 `path` 后，后续 shell 命令使用该目录作为工作目录，文件编辑使用该目录下的绝对路径。进入后先运行：

```bash
git branch --show-current
git rev-parse --show-toplevel
```

不要使用 `-x codex`，该参数会在新 worktree 中启动另一个 Codex 进程，当前任务不会随之切换。新 worktree 从已提交的 `HEAD` 创建，不包含当前目录未提交的文件；任务依赖这些文件时继续使用当前目录，不能创建隔离 worktree。

当前 Agent 已完成真实验证：Worktrunk 创建分支和目录后运行项目 hook，Agent 随后在返回路径中读取 Git 状态、写入并删除验证文件，Vite+ 正确解析 Node.js 24.18.0。验证完成后，测试 worktree 和分支均已删除。

## 依赖存储

每个 worktree 保留自己的 `node_modules`、构建产物和缓存，包内容继续复用 pnpm content-addressable store。不能把主 worktree 的整个 `node_modules` 软链接到其他 worktree。

pnpm 11 的 `enableGlobalVirtualStore` 试验结果如下：

- 新 worktree 的 `node_modules` 表观大小从约 500 MB 降到 864 KB。
- 依赖初始化约 6 秒，复用效果明显。
- `vp check` 无法加载 Vite+ 内置 Rolldown 的原生绑定。
- Vite+ 0.2.4 和 0.2.5 都会出现相同问题。
- 设置 `NODE_PATH` 可以临时绕过，但要求所有 Vite+ 命令携带额外环境变量，不能作为稳定契约。

因此仓库不启用 Global Virtual Store。标准 pnpm store 下，新的 Worktrunk worktree 实测安装约 4 秒，虽然 `node_modules` 表观体积较大，包文件仍通过 pnpm store 复用。

## 稳定开发与预览地址

`vp run dev` 是所有 worktree 的统一开发入口。该任务直接由 Vite+ 声明：通过 `dependsOn` 构建 `@cc98/api` 和 `@cc98/ubb`，再调用 portless 启动网站，不维护额外 Node.js 包装脚本。

启动过程如下：

1. 构建 `@cc98/api` 和 `@cc98/ubb`。
2. 通过 portless 启动网站。
3. portless 为应用分配 4000 至 4999 范围内的随机端口。
4. 主 worktree 使用 `http://cc98.localhost:1355`。
5. 分支 worktree 使用 `http://<branch>.cc98.localhost:1355`。

portless 固定使用 HTTP 高位代理端口 1355，并关闭 `/etc/hosts` 同步，不需要管理员授权、CA 或系统信任。Chrome、Chromium、Firefox 和 agent-browser 可以解析 `.localhost` 子域名；Safari 兼容性不在当前验收范围内。

`vp run preview` 会先执行 `vp run -r build`，再通过 portless 启动 Vite Preview。主 worktree 使用 `http://cc98-preview.localhost:1355`，分支 worktree 使用 `http://<branch>.cc98-preview.localhost:1355`。preview 和 dev 使用不同路由，可以同时运行。

实测并发结果：

| worktree                             | 应用端口 | 稳定地址                                                  |
| ------------------------------------ | -------: | --------------------------------------------------------- |
| 主 worktree                          |     4051 | `http://cc98.localhost:1355`                              |
| `codex/worktree-contract-validation` |     4842 | `http://worktree-contract-validation.cc98.localhost:1355` |

两个地址都返回 HTTP 200，并由隔离的 agent-browser 会话打开。当前 worktree 的地址通过 `PORTLESS_PORT=1355 PORTLESS_HTTPS=0 PORTLESS_SYNC_HOSTS=0 vp exec portless get cc98` 查询。

## 本地凭证

`.worktreeinclude` 只允许复制以下被 Git 忽略的文件：

```text
.cc98-credentials.local
.env.local
apps/website/.env.local
```

`.cc98-credentials.local` 可以直接保存 CC98 登录账号和密码：

```dotenv
CC98_USERNAME=example
CC98_PASSWORD=example
```

这些文件可以是明文，但必须保持 Git 忽略。普通安装、诊断、构建、测试和匿名浏览器验证不能读取或打印凭证；只有明确的登录任务可以使用。

浏览器自动化和 API 登录探测共用 `.cc98-credentials.local`。API 探测每次运行时获取短期 access token，结束后直接丢弃，不持久化 access token 或 refresh token。各 worktree 可以复制同一凭证文件，但 agent-browser 会话、Cookie、截图和录屏仍按 worktree 隔离。

## 外部账号操作

`vp run ready` 保持离线、确定、可重复，不依赖以下状态：

- CC98 账号是否可登录。
- Apifox 是否已登录或具有项目权限。
- 真实 CC98 API 和 Apifox 云端是否可达。
- portless 代理是否正在运行。

需要外部状态的检查由显式命令触发，并在输出中说明是只读检查还是会修改远端数据。

## 验收结果

- [x] 固定 Node.js 24.18.0、pnpm 11.10.0 和 Vite+ 0.2.4。
- [x] 固定 agent-browser、portless 和 Apifox CLI。
- [x] Worktrunk 使用 `vp install` 标准命令初始化 worktree。
- [x] 环境检查使用各工具的标准诊断命令，不新增环境管理脚本。
- [x] 项目内 Node.js 脚本、workspace 任务和本地 CLI 全部通过 Vite+ 进入，不修改用户全局 PATH。
- [x] 安装并验证 Worktrunk 0.68.0，不修改用户 shell。
- [x] Worktrunk 创建真实分支 worktree，并复制白名单内的忽略文件。
- [x] 当前 Agent 在外部 worktree 中完成命令执行和文件读写验证。
- [x] 主 worktree 与分支 worktree 通过 portless 并发启动。
- [x] 两个稳定地址均返回 HTTP 200，并通过 agent-browser 验证。
- [x] 生产构建通过独立的 portless 路由启动 Vite Preview。
- [x] Global Virtual Store 完成兼容试验并因 Vite+ 原生绑定失败而回退。
- [x] 标准 pnpm store 下的新 worktree 执行 `vp run ready` 通过。
- [x] 将 Windows、Linux 和 Safari 的后续反馈列为开放式遗留项，出现真实需求后再单独补适配。

## 遗留项

- Windows、Linux 和 Safari 尚未出现需要当前计划处理的兼容问题。后续收到可复现反馈时新建任务，不让开放式观察阻塞本计划归档。

## 决策记录

- 2026-07-18：宿主机使用 Vite+、Git、curl 和 Worktrunk，Node.js 工具固定在仓库依赖中。
- 2026-07-18：采用 Worktrunk 创建真实分支 worktree，Codex 原生 detached HEAD worktree 不进入推荐流程。
- 2026-07-18：Worktrunk pre-start hook 先复制本地白名单，再运行仓库初始化。
- 2026-07-18：允许明文 CC98 本地凭证通过 `.worktreeinclude` 复制，但文件必须被 Git 忽略，工具不能输出内容。
- 2026-07-18：portless 使用 HTTP 1355，不修改 CA 和 hosts，主 worktree 与分支 worktree 拥有稳定域名。
- 2026-07-18：Global Virtual Store 节省明显，但与 Vite+ 原生绑定加载不兼容，当前不启用。
- 2026-07-18：不采用开发镜像、devcontainer、Nix 或其他完整环境封装。
- 2026-07-18：自定义命令包装会增加 review 和维护成本，初始化、诊断和开发启动优先使用 Worktrunk、Vite+、pnpm 与 portless 的声明式配置和原生命令。
- 2026-07-18：Vite+ 的唯一宿主约束限定在项目内；不执行用户级 `vp env setup`，避免影响其他项目的 fnm、nvm 或系统 Node.js。
- 2026-07-18：当前 Agent 通过 Worktrunk 的 JSON 输出获取 worktree 路径，再显式定向后续工具；不使用 `-x codex` 启动第二个 Agent。
- 2026-07-18：单 worktree 和多 worktree 统一运行 `vp run dev`，不再提供绕过 portless 的 5173 入口。
- 2026-07-18：增加 `vp run preview`，构建后通过独立 portless 路由预览生产产物。
- 2026-07-21：Worktree 分支名改用任务语义前缀，不再固定使用 Agent 或工具名称。

## 参考资料

- [OpenAI Harness Engineering](https://openai.com/index/harness-engineering/)
- [Codex Local Environments](https://learn.chatgpt.com/docs/environments/local-environment)
- [Codex Git Worktrees](https://learn.chatgpt.com/docs/environments/git-worktrees)
- [Worktrunk](https://worktrunk.dev/)
- [Worktrunk Hooks](https://worktrunk.dev/hook/)
- [pnpm 与 Git Worktrees](https://pnpm.io/git-worktrees)
- [pnpm Global Virtual Store](https://pnpm.io/global-virtual-store)
- [Vite+ Environment](https://viteplus.dev/guide/env)
- [Vite+ Installing Dependencies](https://viteplus.dev/guide/install)
- [portless](https://portless.sh/)
- [agent-browser](https://github.com/vercel-labs/agent-browser)
- [Apifox CLI 安装与运行](https://docs.apifox.com/install-and-run-cli)
