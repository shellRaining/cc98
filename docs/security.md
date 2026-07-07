# 应用安全

## Secrets

- 密钥不入库。`.gitignore` 已排除 `*.local`、`.claude/worktrees/` 等。
- 敏感配置走环境变量，前缀 `VITE_` 仅限真正需要暴露给前端的项。
- OAuth client_id / client_secret 属于半公开项（前端 SPA 无法真正保密），但仍走环境变量 `VITE_OAUTH_CLIENT_ID`，不硬编码。
- access_token / refresh_token 存 localStorage（`cc98:auth-token` key），注意：
  - XSS 防线是第一道（见下），token 暴露 = 账号被控
  - 401 自动清 token（`lib/http.ts` 的 `onResponseError`）
  - 后续如升级到 httpOnly cookie 方案，需要后端配合
- 新增敏感文件路径时同步更新 `.gitignore`。

## 前端安全

- 用户输入到渲染前必须净化。本项目三种内容渲染路径各有约束：
  - Markdown（contentType=1）：markdown-it 渲染，配 markdown-it-sanitizer 或 DOMPurify 净化，禁用 `<script>` / `onerror` / `javascript:` 等
  - UBB（contentType=0）：`packages/ubb` 渲染器输出受控 VNode，标签白名单严格收敛（49 个 handler 各自决定是否允许 URL / 图片 / 媒体），不接受任意 HTML
  - 纯文本：转义后输出
- 外部数据通过 Zod parse at boundary 验形状后再用（`api/schemas.ts`）。
- 跨域资源走 CORS 白名单，不开放通配。file.cc98.org / api-v2.cc98.org / player.bilibili.com 是已知白名单域。
- `target="_blank"` 的链接加 `rel="noopener noreferrer"`。

## 依赖

见 `docs/dependency.md`。

## 上报

发现漏洞按安全流程处理（如建立专门流程时在本文件登记）。
