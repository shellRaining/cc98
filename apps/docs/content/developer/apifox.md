# 用 Apifox 调试 CC98 API

CC98 的业务接口和登录接口位于两个不同的服务中。Apifox 项目也应使用两个模块，让每个模块保留自己的前置 URL：

| 模块     | OpenAPI 数据源                                         | 前置 URL                  |
| -------- | ------------------------------------------------------ | ------------------------- |
| 主站 API | `https://cc98-api-docs.vercel.app/openapi.json`        | `https://api-v2.cc98.org` |
| OpenID   | `https://cc98-api-docs.vercel.app/openid.openapi.json` | `https://openid.cc98.org` |

调试登录接口时，先向 OpenID 换取 Token，再把返回的 `access_token` 保存为 Apifox 变量。主站 API 的 Bearer 鉴权引用这个变量，后续请求就不必重复粘贴 Token。

本文按 2026 年 7 月的 Apifox 界面编写。以后版本如果调整了按钮位置，可以按文中的设置名称搜索对应入口。

## 准备网络和账号

开始前需要准备：

- Apifox 桌面客户端。
- 可以访问 CC98 的网络。部分 CC98 域名会解析到浙大校内地址，需要连接校园网或正确配置浙大代理。
- 一个可登录的 CC98 账号。

账号密码、Access Token 和 Refresh Token 都属于账号凭证，泄露后会带来账号访问风险。不要把它们保存到变量的远程值、接口用例或公开截图中。Apifox 的本地值只保存在当前设备，适合存放 Token；密码登录成功后，建议立即清空请求里的密码字段。

## 创建项目并导入两份 OpenAPI

### 创建空项目

在 Apifox 主窗口创建一个 HTTP 项目，可以命名为 `CC98 API`。新项目自带一个默认模块，先把它作为主站 API 模块使用。

默认模块保留原名也不影响调试。如果希望名称和本文一致，可以进入模块页，在模块的更多菜单中将它改为“主站 API”。不同版本的重命名入口可能略有差异。

### 导入主站 API

进入“项目设置 > 导入数据 > 定时导入（绑定数据源）”，新建数据源并填写：

| 设置       | 值                                              |
| ---------- | ----------------------------------------------- |
| 数据源名称 | `主站 API OpenAPI`                              |
| 数据源 URL | `https://cc98-api-docs.vercel.app/openapi.json` |
| 目标分支   | `main`                                          |
| 导入到     | 默认模块或“主站 API”模块                        |

导入选项建议这样设置：

- 冲突处理选择“智能合并”。
- 开启“导入 Servers 为环境”。
- 开启“导入 Security Scheme”。
- 开启接口目录同步。
- 第一次导入先不要删除数据源中不存在的资源。确认两个模块的边界正确后，再决定是否开启清理。

保存数据源并执行一次导入。主站接口应出现在默认模块中。

### 导入 OpenID

再新建一个定时导入数据源：

| 设置       | 值                                                     |
| ---------- | ------------------------------------------------------ |
| 数据源名称 | `OpenID OpenAPI`                                       |
| 数据源 URL | `https://cc98-api-docs.vercel.app/openid.openapi.json` |
| 目标分支   | `main`                                                 |
| 导入到     | 新建模块 `OpenID`                                      |

导入选项与主站 API 保持一致。完成后，`POST /connect/token` 应只出现在 OpenID 模块中。

Apifox 默认由本地客户端触发定时导入。只有客户端已打开、当前账号有项目写入权限，并且到达设置的导入间隔时才会执行。需要无人值守同步时，应使用 Apifox 通用 Runner。

## 检查两个模块的前置 URL

打开“环境管理”，选择准备调试的环境，确认两个模块分别使用：

- 主站 API：`https://api-v2.cc98.org`
- OpenID：`https://openid.cc98.org`

模块有各自独立的前置 URL。发送请求前可以看一眼完整地址：

- `GET /config/global` 应发送到 `https://api-v2.cc98.org/config/global`。
- `POST /connect/token` 应发送到 `https://openid.cc98.org/connect/token`。

如果 `/connect/token` 前面显示的是 `https://api-v2.cc98.org`，说明接口位于错误模块，或者 OpenID 模块的前置 URL 配错了。

## 先测试匿名接口

在主站 API 模块打开 `GET /config/global` 并发送请求。这个接口不要求登录，适合先检查网络和前置 URL。

收到 HTTP 200 后再继续配置登录。如果这里已经超时，先处理校园网或代理，不需要检查 Token。

## 通过 OpenID 换取 Token

在 OpenID 模块打开 `POST /connect/token`。请求体类型应为 `application/x-www-form-urlencoded`。

当前接口支持两种请求方式。Apifox 可能会同时显示七个表单字段，但一次请求只填写对应方式需要的字段。

### 使用账号密码登录

填写这些字段：

| 字段            | 值                               |
| --------------- | -------------------------------- |
| `client_id`     | 当前项目的 OpenID Client ID      |
| `client_secret` | 当前项目的 OpenID Client Secret  |
| `grant_type`    | `password`                       |
| `username`      | CC98 用户名                      |
| `password`      | CC98 密码                        |
| `scope`         | `cc98-api openid offline_access` |

`refresh_token` 留空或禁用。调试当前 Web 项目时，可以从[登录实现源码](https://github.com/shellRaining/cc98/blob/main/apps/website/src/lib/oauth.ts)复制 `DEFAULT_CLIENT_ID` 和 `DEFAULT_CLIENT_SECRET`，避免在文档中再维护一份可能过期的值。

不要把用户名和密码保存成团队共享的环境值，也不要把带有真实密码的请求保存为共享用例。

### 保存返回的 Token

先在“环境管理”中为当前环境添加 `cc98_access_token`、`cc98_refresh_token` 和 `cc98_expires_in`，三个变量的远程值都保持为空。

切换到“后置操作”，依次添加三个“提取变量”：

| 变量名               | 变量类型 | 提取来源      | JSONPath          |
| -------------------- | -------- | ------------- | ----------------- |
| `cc98_access_token`  | 环境变量 | Response JSON | `$.access_token`  |
| `cc98_refresh_token` | 环境变量 | Response JSON | `$.refresh_token` |
| `cc98_expires_in`    | 环境变量 | Response JSON | `$.expires_in`    |

发送请求。成功响应为 HTTP 200，三个变量会写入当前环境的本地值，不会同步给团队成员。请求结束后清空密码字段，避免密码留在编辑中的请求里。

### 使用 Refresh Token 刷新

Access Token 过期后，仍然调用同一个 `POST /connect/token`，但只填写：

| 字段            | 值                              |
| --------------- | ------------------------------- |
| `client_id`     | 当前项目的 OpenID Client ID     |
| `client_secret` | 当前项目的 OpenID Client Secret |
| `grant_type`    | `refresh_token`                 |
| `refresh_token` | `{{cc98_refresh_token}}`        |

`username`、`password` 和 `scope` 留空或禁用。保留前面的三个提取变量，刷新成功后会自动覆盖旧的 Access Token 和 Refresh Token。

## 让主站接口自动携带 Token

打开主站 API 模块的顶层接口目录，在 `Auth` 中选择导入的 `bearerAuth` 鉴权组件或 Bearer Token，并把 Token 值设置为：

```text
{{cc98_access_token}}
```

保存后，继承该鉴权配置的接口会自动发送：

```http
Authorization: Bearer <access-token>
```

OpenAPI 已标记哪些接口需要 Bearer 鉴权，匿名接口应保持“无需鉴权”。不要给 OpenID 模块的 `/connect/token` 添加 Bearer Token，它本身就是获取 Token 的接口。

## 验证登录是否生效

在主站 API 模块打开 `GET /me` 并发送请求：

- HTTP 200 表示 Token 和 Bearer 鉴权已经生效。
- HTTP 401 通常表示 `cc98_access_token` 为空、已经过期，或者 Auth 没有引用该变量。
- HTTP 403 表示账号没有当前操作所需的权限，刷新 Token 不会增加账号权限。

初次调试建议只调用匿名或登录只读接口。发帖、删除、管理、财富和封禁等接口会修改真实论坛数据，不要把它们当作连通性测试。

## 常见问题

### `/connect/token` 返回 404，提取变量提示 `No data`

先看实际请求地址。正确地址是：

```text
https://openid.cc98.org/connect/token
```

如果请求发到了 `https://api-v2.cc98.org/connect/token`，服务会返回 404，响应中没有 Token，后置操作才会继续报 `No data`。先修正模块或前置 URL，提取变量本身通常不需要修改。

### Token 接口返回 400 或登录失败

检查 `Content-Type` 是否为 `application/x-www-form-urlencoded`，再检查 `grant_type` 对应的字段是否填全。密码登录不要填写 `refresh_token`，刷新时不要同时提交用户名和密码。

### `/me` 返回 401

打开当前环境的变量列表，确认 `cc98_access_token` 有值。然后检查主站 API 的 Auth 是否使用 `{{cc98_access_token}}`。变量为空或已经过期时，重新执行密码登录或 Refresh Token 请求。

### Apifox 连接 `10.x` 地址超时

这通常是校园网路由或代理问题。Apifox 这类图形应用不一定继承终端代理变量。如果终端可以访问 CC98，但 Apifox 显示 `ETIMEDOUT`，可以在 Apifox 的 API 请求代理设置中填写本机正在使用的 HTTP 代理地址。使用 Mihomo、Sparkle 或 Clash 时，端口常见为 `7890`，应以本机实际配置为准，并且不要绕过 `cc98.org`。

### 定时导入没有自动执行

默认定时导入依赖 Apifox 客户端。确认项目已经在有写入权限的客户端中打开，并且距离上次导入已经超过设置的间隔。客户端长期关闭时，需要用通用 Runner 执行无人值守任务。

## 清理敏感数据

调试结束后，清空请求中的密码，并删除不再使用的 `cc98_access_token` 和 `cc98_refresh_token`。分享截图、请求记录或错误日志前，检查 Body、Headers、环境变量和实际请求面板，确保没有账号、密码或 Token。
