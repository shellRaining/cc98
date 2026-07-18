---
name: configure-zju-proxy
description: 配置和排查浙大校园网代理，用于访问 ZJU、RVPN、WebVPN、CC98 及真实 CC98 API。用户需要安装 zju-connect、接入 Sparkle/Mihomo/Clash、避免官方 aTrust 客户端、配置 macOS launchd，或遇到 curl 可用但 Apifox/浏览器连接 10.x 地址超时时使用。公司网络同样使用 10.0.0.0/8 时，优先按域名路由，不要直接接管整段私网地址。
---

# 配置浙大校园代理

## 项目背景

本项目会访问真实 CC98 服务。部分 CC98 域名解析到浙大校内私网地址，例如 `api-v2.cc98.org` 可能解析为 `10.10.98.98`。开发机同时连接公司内网时，公司和浙大可能都使用 `10.0.0.0/8`，不能只根据 IP 判断流量应该去哪里。

默认采用最小链路：

1. `zju-connect` 在 `127.0.0.1:1090` 提供 SOCKS5 代理，负责进入浙大校园网。
2. Sparkle、Mihomo 或 Clash 在本机提供统一代理端口，例如 `127.0.0.1:7890`。
3. 代理客户端按域名把 ZJU 和 CC98 流量转交给 `zju-connect`，公司内网和普通流量保持原有路由。
4. 手动验证通过后，再用 `launchd` 启动 `zju-connect`。

普通网页和 CC98 访问不要启用 `zju-connect` TUN 模式，也不要在已有 Sparkle、Mihomo 或 Clash 时再安装一套 GUI 代理。

## 私网地址冲突

`10.0.0.0/8` 是可被不同组织重复使用的私网地址，不代表某一个固定网络。公司内网的 `10.x` 和浙大内网的 `10.x` 可以同时存在，但本机必须根据域名、进程或显式代理选择正确出口。

在公司网络中遵循以下规则：

- 优先使用 `DOMAIN-SUFFIX,zju.edu.cn`、`DOMAIN-SUFFIX,zjusec.com` 和 `DOMAIN-SUFFIX,cc98.org`。
- 不要默认加入 `IP-CIDR,10.0.0.0/8,ZJU-Campus`，它可能把公司服务错误送进浙大代理。
- 只有用户明确需要访问没有域名的浙大 `10.x` 服务，并确认不会影响公司内网时，才增加更窄的 IP 段或临时启用整段规则。
- 不要默认接管 `172.16.0.0/12`，它还可能覆盖 Docker、虚拟机和本地局域网。

## curl 与 GUI 客户端行为不同

排查时分别检查两套代理来源：

- 命令行 `curl` 通常读取 `HTTP_PROXY`、`HTTPS_PROXY` 和 `NO_PROXY`。如果环境变量指向 `127.0.0.1:7890`，请求会先进入 Mihomo，再由域名规则转给 `zju-connect`。
- Apifox、浏览器等 GUI 应用通常读取 macOS 系统代理或自己的代理设置，不一定继承终端环境变量。
- macOS 系统代理常把 `10.0.0.0/8` 设为绕过代理。应用解析出 `10.10.98.98` 后可能直接连接公司网络出口，最终得到 `connect ETIMEDOUT 10.10.98.98:443`。
- `connect ETIMEDOUT` 表示 TCP 连接尚未建立，不是 CC98 Web 服务器处理请求太慢。应用显示的“服务器超时”可能只是泛化提示。

Apifox 出现这类差异时，优先为“API 请求”单独配置自定义 HTTP 代理：

- 主机：`127.0.0.1`
- 端口：使用当前 Mihomo HTTP 代理端口，常见值为 `7890`
- 协议：HTTP 和 HTTPS
- Bypass：不要加入 `cc98.org` 或 `10.0.0.0/8`

不要为了修复单个应用，直接删除系统中整个 `10.0.0.0/8` 的绕过规则。公司内网通常依赖这条规则保持直连。

## 协议选择

普通网页和 CC98 访问先使用：

```toml
protocol = "easyconnect"
```

当以下命令返回正常 HTTP 响应时，EasyConnect 已经够用：

```bash
curl --socks5-hostname 127.0.0.1:1090 -I https://www.cc98.org
```

只有 EasyConnect 无法满足 SSH、UDP 或完整三层隧道需求时，才改用 `protocol = "atrust"`。

## 安装 zju-connect

用户要求直接配置时，从官方 GitHub Release 下载最新稳定版：

`https://github.com/Mythologyli/zju-connect/releases`

按平台选择：

- macOS Apple Silicon：`zju-connect-darwin-arm64.zip`
- macOS Intel：`zju-connect-darwin-amd64.zip`
- Linux arm64：`zju-connect-linux-arm64.zip`
- Linux x86_64：`zju-connect-linux-amd64.zip`

下载到临时目录或工作区 `work/`，不要下载进 dotfiles。使用 `curl -fL`，上游提供 SHA256 时必须校验；没有上游校验值时，计算并报告本地 SHA256。

解压后安装：

```bash
mkdir -p ~/.local/bin ~/.config/zju-connect/logs
install -m 0755 zju-connect ~/.local/bin/zju-connect
xattr -c ~/.local/bin/zju-connect
```

读取现有 `~/.config/zju-connect/config.toml` 后再修改，不要直接覆盖。修改前保留备份。

## 最小配置

创建 `~/.config/zju-connect/config.toml`，权限设为 `600`。除非用户明确需要，不启用 HTTP 监听。

```toml
protocol = "easyconnect"
server_address = "rvpn.zju.edu.cn"
server_port = 443

username = "YOUR_ZJU_ID"
password = "YOUR_ZJU_PASSWORD"

socks_bind = "127.0.0.1:1090"
http_bind = ""

disable_zju_config = false
disable_zju_dns = false
disable_multi_line = true
zju_dns_server = "auto"
secondary_dns_server = "114.114.114.114"
dns_ttl = 3600

tun_mode = false
tcp_tunnel_mode = false
debug_dump = false
```

`disable_multi_line = true` 可以避免自动选择不稳定的 RVPN 线路。配置文件包含密码，禁止在回复、日志和提交中输出真实内容。

## 可选的 dotfiles 集成

只有用户明确要求时，才把配置纳入 dotfiles。只保存 `config.toml`、`sparkle-override.yaml` 等配置文件，不保存日志和二进制。

`~/.config/zju-connect` 保持为本地真实目录，内部保留 `logs/`。可以链接或复制单个配置文件，同一文件系统优先使用硬链接，失败时复制。不要把整个运行目录软链接到 macOS 的 `~/Documents`，LaunchAgent 可能无法访问受保护路径。

## Sparkle、Mihomo 与 Clash 路由

先读取现有 profile 和 override，必要时备份。只把规则挂到当前 profile，除非用户要求全局生效。

公司网络上的推荐配置：

```yaml
+proxies:
  - name: ZJUconnect
    type: socks5
    server: 127.0.0.1
    port: 1090
    udp: true

+proxy-groups:
  - name: ZJU-Campus
    type: select
    proxies:
      - ZJUconnect
      - DIRECT

+rules:
  - PROCESS-NAME,zju-connect,DIRECT
  - DOMAIN,rvpn.zju.edu.cn,DIRECT
  - DOMAIN,vpn.zju.edu.cn,DIRECT
  - DOMAIN,webvpn.zju.edu.cn,DIRECT
  - DOMAIN-SUFFIX,zju.edu.cn,ZJU-Campus
  - DOMAIN-SUFFIX,zjusec.com,ZJU-Campus
  - DOMAIN-SUFFIX,cc98.org,ZJU-Campus
```

只有确认需要后，才追加 IP 规则。优先填写实际目标的最窄 CIDR。整段规则仅作为临时兜底：

```yaml
- IP-CIDR,10.0.0.0/8,ZJU-Campus,no-resolve
```

修改后重启 Sparkle 或 Mihomo core，确认运行时配置包含 `ZJUconnect`、`ZJU-Campus` 和域名规则。

## 验证与排障

先前台启动：

```bash
zju-connect -config ~/.config/zju-connect/config.toml
```

正常信号包括：

- `VPN client started`
- `SOCKS5 server listening on 127.0.0.1:1090`
- `KeepAlive using UDP: OK`

按层验证，不要只看最终应用报错：

```bash
# 1. 查看 DNS 结果
dig +short api-v2.cc98.org A

# 2. 直接验证 zju-connect
curl --socks5-hostname 127.0.0.1:1090 -I https://www.cc98.org

# 3. 验证 Mihomo 入口和域名规则
curl -x http://127.0.0.1:7890 -I https://www.cc98.org

# 4. 确认命令行实际使用的代理变量
env | rg -i '^(http|https|all|no)_proxy='

# 5. 检查 macOS 系统代理和绕过列表
scutil --proxy

# 6. 对照直连结果，限制超时时间
curl --noproxy '*' --connect-timeout 5 -I https://api-v2.cc98.org/config/global
```

解释结果时遵循以下顺序：

1. SOCKS 失败：先检查 `zju-connect` 登录、监听端口和日志。
2. SOCKS 成功、Mihomo 失败：检查 override 是否挂到活动 profile，以及运行时配置是否包含规则。
3. curl 成功、GUI 应用失败：检查 GUI 应用的代理来源、系统绕过列表和应用自身代理设置。
4. 收到 HTTP `200`、`302`、`401`、`403`：网络链路已经建立，再分析认证或站点权限。
5. 报 `ETIMEDOUT`、`ENETUNREACH`：优先分析 DNS、路由和代理，不要先归因于服务端业务逻辑。

`www.zju.edu.cn` 返回 `403 Forbidden` 可能是正常站点响应，不代表代理失败。WebVPN 跳转到 `/login` 的 `302 Found` 也说明链路可用。

## launchd 服务

只有前台验证通过后，才创建用户级 LaunchAgent，不要创建 root daemon。

plist 中的路径必须是当前用户的绝对路径，不能使用 `~` 或 `$HOME`。生成 plist 时用当前 `HOME` 展开后的值替换示例路径，并把日志放在 `~/.config/zju-connect/logs/`。

加载和启动：

```bash
plutil -lint ~/Library/LaunchAgents/com.shellraining.zju-connect.plist
uid=$(id -u)
launchctl bootstrap "gui/$uid" ~/Library/LaunchAgents/com.shellraining.zju-connect.plist
launchctl enable "gui/$uid/com.shellraining.zju-connect"
launchctl kickstart -k "gui/$uid/com.shellraining.zju-connect"
launchctl print "gui/$uid/com.shellraining.zju-connect"
```

卸载：

```bash
uid=$(id -u)
launchctl bootout "gui/$uid/com.shellraining.zju-connect"
```
