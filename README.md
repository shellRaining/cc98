# CC98 论坛

基于 Vue 3 和 Vite+ 的 CC98 论坛前端。

## 开发环境

宿主机需要 Git、curl 和全局 Vite+。并行 Agent 开发推荐安装 [Worktrunk](https://worktrunk.dev/)；macOS 可以执行：

```bash
brew install worktrunk
```

拉取代码或进入新 worktree 后运行：

```bash
vp install
```

需要浏览器自动化时，再按需检查或安装浏览器运行环境：

```bash
vp exec agent-browser doctor
vp exec agent-browser install
```

项目内的 Node.js、包管理器和 Node CLI 统一由 Vite+ 解析：终端直接运行 Node 脚本时使用 `vp node`，workspace 任务使用 `vp run`，本地 CLI 使用 `vp exec`。`vp run` 管理的 package script 已处于 Vite+ 运行时中，可以直接调用 `node`。项目不会执行 `vp env setup` 或修改全局 PATH，其他项目仍可继续使用 fnm、nvm 或系统 Node.js。

## Agent 如何进入新 Worktree

需要隔离开发时，当前 Agent 运行：

```bash
wt switch --create codex/<task-name> --base=@ --no-cd --format json
```

Worktrunk 会返回新 worktree 的 `path`。Agent 之后必须把所有命令的工作目录和文件编辑路径切到该目录，并用 `git branch --show-current`、`git rev-parse --show-toplevel` 确认位置。不要使用 `-x codex`，它会启动另一个 Codex 进程，无法切换当前任务。

新 worktree 从已提交的 `HEAD` 创建，不包含当前目录尚未提交的改动。任务依赖这些改动时，应继续使用当前目录，不能直接创建 worktree。Worktrunk 会按 `.config/wt.toml` 复制 `.worktreeinclude` 中声明的本地文件，再运行 `vp install --frozen-lockfile --prefer-offline`。

本地登录文件约定如下，均已被 Git 忽略：

```dotenv
# .cc98-credentials.local
CC98_USERNAME=example
CC98_PASSWORD=example
```

浏览器自动化和 API 登录探测共用这份账号密码。API 探测会在运行时获取短期 access token，进程结束后直接丢弃，不需要另外维护 token 文件。普通环境检查不读取或打印凭证。

## 常用命令

```bash
vp run dev     # 通过 portless 启动当前 worktree
vp run preview # 构建并预览生产产物
vp run ready   # format + lint + typecheck + test + build
```

## 测试部署

测试站部署在 Vercel，项目根目录保持为仓库根目录。Vercel 会按 `vercel.json` 执行全量 workspace 构建，并发布 `apps/website/dist`。Vue Router 使用 history 模式，所有未命中静态文件的请求都会回退到 `index.html`。

Vercel CLI、skill 和账号授权是维护者本地工具，不属于 workspace 依赖。普通协作者只需使用仓库中的 `vercel.json`；有项目权限的维护者可以自行使用 Vercel CLI、MCP 或控制台管理部署和域名。CLI 生成的 `.vercel/` 只保存本地项目关联，不提交到仓库。

生产域名为 `cc98.shellraining.xyz`。在 Vercel 项目中添加该域名后，按控制台给出的目标值配置 CNAME。项目会从浏览器直接访问 CC98 API、OpenID 和 SignalR 服务，测试用户仍需具备相应的校园网访问条件，相关服务也需要允许该域名发起跨域请求。

查询当前 worktree 的稳定地址：

```bash
PORTLESS_PORT=1355 PORTLESS_HTTPS=0 PORTLESS_SYNC_HOSTS=0 vp exec portless get cc98
```

主 worktree 默认为：

```bash
http://cc98.localhost:1355
```

分支 worktree 使用 `http://<branch>.cc98.localhost:1355`。所有 worktree 都运行 `vp run dev`，portless 会分配应用端口并注册对应域名。端口代理使用普通 HTTP 和高位端口，不需要管理员授权或本地 CA。

`vp run preview` 会先执行全量构建，再用 Vite Preview 启动生产产物。主 worktree 使用 `http://cc98-preview.localhost:1355`，分支 worktree 使用 `http://<branch>.cc98-preview.localhost:1355`，可以和 dev server 同时运行。

环境异常时直接使用各工具的标准诊断命令：

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
