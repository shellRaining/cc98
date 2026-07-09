# 登录体系迁移执行计划

## 背景

逐步复刻老 CC98 前端，第一阶段目标：登录体系迁移到能访问所有帖子。老项目登录体系已调研完毕（见下方"协议事实"），本计划在新项目（Vue 3 SPA）精确还原登录行为。

## 协议事实（来自 /Users/shellraining/Documents/Forum 调研）

OAuth2 Password Grant，对接独立 IdentityServer4。

- 登录端点：`POST https://openid.cc98.org/connect/token`
  - Content-Type：`application/x-www-form-urlencoded`
  - body（登录）：`client_id`、`client_secret`、`grant_type=password`、`username`、`password`、`scope=cc98-api openid offline_access`（value 需 URL 编码）
- 登录响应（snake_case）：`access_token: string`、`expires_in: number`（秒）、`refresh_token: string`、`token_type: string`（"Bearer"）
- 固定凭证（前端半公开，老项目硬编码）：`client_id=9a1fd200-8687-44b1-4c20-08d50a96e5cd`，`client_secret=8b53f727-08e2-4509-8857-e34bf92b27f2`
- 刷新端点：同 `/connect/token`，body：`client_id`、`client_secret`、`grant_type=refresh_token`、`refresh_token`（不带 scope）
- token 存储：localStorage，access 过期 = `expires_in` 秒，refresh 固定 30 天（2592000 秒）
- 请求头：`Authorization: Bearer {access_token}`
- 懒刷新：发请求前若 access 过期，用 refresh 换新；refresh 也失效则清登录态
- 用户信息：`GET https://api-v2.cc98.org/me`（业务 API base url），响应 `MeUser`（camelCase）
- 登录态判定：refresh_token 与 userInfo 同时有效
- 登出：清认证相关 localStorage + sessionStorage，无服务端调用
- 无游客 token、无记住我、无密码加密、无验证码
- 无全局 401 拦截重试，靠懒刷新

## 非目标

- 不做注册、找回密码、改密。
- 不做 SignalR 鉴权（后续消息通知阶段再做）。
- 不做 IndexedDB 缓存其他用户资料。
- 不做跨 tab storage 事件同步（可作后续增强）。
- 不做游客模式 token。

## 模块设计

新增/改动集中在 `apps/website/src/lib/` 和 `src/api/`、`src/stores/`。HTTP 业务 API 走 `apiFetch`（ofetch，base `https://api-v2.cc98.org`），OAuth 端点（openid.cc98.org，form-urlencoded）用独立路径处理，是合理的边界例外。

### 1. `src/lib/token-store.ts`（新）

纯 localStorage token 存储 + 过期判定，不耦合 DOM（可注入存储适配器，便于纯 node 测试）。

- `AUTH_STORAGE_KEY = "cc98:auth"`
- `AuthData { accessToken: string; accessTokenExpiresAt: number; refreshToken: string; refreshTokenExpiresAt: number }`（时间戳为 ms）
- `createTokenStore(adapter?)` → 单例 `tokenStore`，含：`load()`、`save(data)`、`clear()`、`getAccessToken()`（过期返回 null，不主动删）、`getRefreshToken()`、`hasValidAuth()`（refresh 未过期）、`onCleared(cb)`（clear 时通知）
- `createAuthData(tokenResponse)`：access TTL=`expires_in` 秒，refresh TTL=30 天，expiresAt=`Date.now()+ttl*1000`
- 默认 adapter 指向 `globalThis.localStorage`，SSR/无 DOM 时用内存 noop

### 2. `src/lib/oauth.ts`（新）

OAuth 协议层。用全局 `fetch`（便于测试 mock），不走 `apiFetch`。

- 常量：`OAUTH_CLIENT_ID`、`OAUTH_CLIENT_SECRET`、`OAUTH_SCOPE`、`CONNECT_TOKEN_URL`、`REFRESH_TOKEN_TTL_MS`
- 凭证读 `import.meta.env.VITE_OAUTH_CLIENT_ID` / `VITE_OAUTH_CLIENT_SECRET`，缺省回退老项目硬编码值
- `tokenResponseSchema`（zod）：`access_token`、`expires_in`、`refresh_token`、`token_type`
- `buildPasswordTokenBody(username, password)`：返回 `URLSearchParams`
- `buildRefreshTokenBody(refreshToken)`：返回 `URLSearchParams`
- `requestPasswordToken(username, password)`：POST，parse 校验，抛错（ofetch 不介入，非 2xx 由 fetch Response 判断）
- `requestRefreshToken(refreshToken)`：同上

### 3. `src/lib/http.ts`（重构）

去掉内联 token 逻辑，改用 token-store + oauth。

- `apiFetch` 的 `onRequest`：调 `ensureValidAccessToken()`，有则设 `Authorization`
- `ensureValidAccessToken()`：①access 未过期直接返回；②refresh 有效则 `requestRefreshToken`→save→返回新 access；③否则返回 null（匿名请求）。刷新失败→`clear()`→返回 null。并发去重（同一时刻只发一次刷新）
- `onResponseError`：401 时 `tokenStore.clear()`（触发 store 失效回调）
- 导出 `apiFetch` 不变，业务侧零改动

### 4. `src/api/schemas.ts`（追加）

- `meUserSchema`（zod，passthrough）：`id`、`name`、`portraitUrl`、`photourl`、`gender`、`lockState`、`privilege`、`isVerified`、`postCount`、`prestige`、`displayTitle`、`levelTitle` 等（按 OpenAPI MeUser，必填仅核心几项，其余 optional）
- `type MeUser`

### 5. `src/api/queries.ts`（追加）

- `queryKeys.currentUser = ["current-user"]`
- `currentUserQuery`：`GET /me` → `meUserSchema.parse`

### 6. `src/stores/user.ts`（重构）

- `AuthUser { id: number; name: string; avatarUrl: string | null; privilege: string }`（精简，header 用）
- `login(username, password)`：`requestPasswordToken`→`tokenStore.save`→`GET /me`→`setUser`（avatarUrl←portraitUrl||photourl）→返回；锁定账号（lockState 1/2）抛错并清理
- `logout()`：`tokenStore.clear()` + 清 user + 清 sessionStorage
- 应用启动订阅 `tokenStore.onCleared` → 同步清 user（401/刷新失败时 UI 立即反映）
- `isLoggedIn = computed(user !== null && hasToken)`
- persist user（精简）+ hasToken

### 7. `src/views/LogOnView.vue`（实现）

表单：用户名、密码、提交。调 `user.login()`，错误（400→密码错误）展示。成功跳来源页或首页（`logOnRedirectUrl`）。

### 8. `src/main.ts`

挂载时初始化 store 订阅 token 失效。

## TDD 安排

按 `docs/quality.md`：主 agent 不写测试。派子 agent 先写测试（针对 token-store、oauth、ensureValidAccessToken 编排逻辑），主 agent 实现使其通过。测试不依赖 DOM（token-store 注入 adapter）。

## 验收标准

- `vp run ready` 通过
- 登录/刷新/登出/懒刷新/过期判定/401 清理 行为有测试覆盖
- OAuth 请求的 URL、method、Content-Type、body 字段与老项目一致
- /me schema 经 Zod parse
- 业务请求自动带 Authorization，access 过期自动刷新
- `docs/security.md` 同步更新（key 变更、刷新机制）

## 决策记录

- 2026-07-09：OAuth client 凭证走 env var，回退老项目硬编码值（SPA 无法保密，半公开）。
- 2026-07-09：access token 存 "Bearer xxx" 整串（贴近老项目），expiresAt 用 ms 时间戳（不做老项目的截断 hack，更可读）。
- 2026-07-09：不做跨 tab storage 同步，留作后续增强。
- 2026-07-09：OAuth 端点用全局 fetch 而非 apiFetch（不同 host + form-urlencoded + 可测试性）。
