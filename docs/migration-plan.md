# CC98 论坛前端复刻迁移计划

## 背景

复刻浙江大学 CC98 论坛前端。原项目 `/Forum`（React 16 + Redux + Webpack 4），新项目 `apps/website`（Vue 3.6 + Vite+ monorepo）。后端不动，只做前端。

技术选型和关键约束见 `docs/adr/0001-tech-stack.md`。UBB 解析层的技术决策见 `docs/exec-plans/2026-07-08-ubb-migration.md`。

## 现状

已完成：

- 项目脚手架，路由表 6 条，分层边界见 `ARCHITECTURE.md`
- API 层：Zod schema（`api/schemas.ts`）、vue-query queryOptions（`api/queries.ts`）、ofetch HTTP 客户端带 token 注入和 401 自动清理（`lib/http.ts`）
- Pinia store：user（登录态）、theme（主题）
- 媒体组件：AudioPlayer / VideoPlayer / BiliPlayer（`components/media/`）
- 页面：HomeView（首页，消费真实 API）、BoardListView（版面列表，消费真实 API）、NotFoundView（404）
- UBB 解析地基（`packages/ubb`）：parseUbb（AST）、ubbToMarkdown、ubbToHtml，320 条测试通过。详见 `docs/exec-plans/2026-07-08-ubb-migration.md`

占位待做：TopicView（楼层）、BoardView（主题列表）、LogOnView（登录）。

API 验证：OpenAPI 探测覆盖 128 端点，62 个匿名/鉴权 GET 通过，写操作 54 个标 401 受保护。结果见 `Forum/cc98-openapi-test-notes.md`。

## 依赖链与阶段顺序

顺序由技术依赖决定：

1. 渲染地基（UBB Vue 层 + Markdown 渲染）是所有楼层渲染的前置，99% 老帖依赖它
2. 登录是所有 `/me/*` 个人功能和受限版面测试的前置
3. 核心读闭环依赖渲染地基和登录。登录后才能用真实内容版面做完整测试
4. 之后是发现页、用户中心、写流程、实时消息、主题与收尾

关于匿名可读性：个别版面（老师答疑、新生指南、校园信息等边缘版面）匿名可读，但论坛主体内容版面（似水流年、心灵之约等）匿名策略不稳定，实测同一路径不同时间返回 200 或 401。所以核心读闭环排在登录之后，用受限版面做完整测试。

## 阶段总览

| 阶段 | 名称              | 状态   | 依赖    | 主要页面                                | 关键 API                                                                                 |
| ---- | ----------------- | ------ | ------- | --------------------------------------- | ---------------------------------------------------------------------------------------- |
| 0    | 脚手架与 API 地基 | 完成   | -       | HomeView / BoardListView / 404          | /config/global, /board/all, /topic/hot-monthly                                           |
| 1    | 渲染地基          | 待开始 | 0       | PostContent 组件、Pager 组件            | UBB Vue 层消费 packages/ubb                                                              |
| 2    | 登录流程          | 待开始 | 0       | LogOnView                               | /connect/token                                                                           |
| 3    | 核心读闭环        | 待开始 | 1, 2    | TopicView、BoardView                    | /board/{id}, /board/{id}/topic, /topic/{id}, /topic/{id}/post                            |
| 4    | 发现与列表页      | 待开始 | 1, 2    | 热门、新帖、推荐、搜索、用户主页        | /topic/hot-{type}, /topic/new, /topic/search, /board/search, /user/{id}                  |
| 5    | 用户中心          | 待开始 | 2       | UserCenterView                          | /me/recent-topic, /me/recent-post, /me/favorite-topic-group, /me/followee                |
| 6    | 写流程            | 待开始 | 1, 2, 3 | EditorView                              | /topic/save/board/{id}, /topic/{id}/post, /post/{id}/like, /me/favorite/{topicId}, /file |
| 7    | 实时交互与消息    | 待开始 | 2       | Message、Notification、Focus、Signin    | `/message`, `/notification/at\|reply\|system`, `/me/signin`, SignalR                     |
| 8    | 主题、活动与收尾  | 待开始 | 2       | AnnualReview、SiteManage、Index、错误页 | `/me/annual-review-{year}`, `/topic/{id}/lock\|top\|highlight\|moveto`                   |

每个阶段的详细执行计划在阶段启动时单独写进 `docs/exec-plans/`，本文件只做总进度跟踪。

## 各阶段说明

### 阶段 1：渲染地基

范围：UBB Vue 渲染层（消费 `packages/ubb` 的 AST 或 HTML 输出）、Markdown 渲染管线（markdown-it + sanitizer）、`<PostContent>` 组件（按 `Post.contentType` 分流，0 走 UBB，1 走 Markdown）、`<Pager>` 翻页器。

UBB 输出格式待定。`packages/ubb` 已产出纯数据 AST 和 HTML 字符串两路输出，Vue 层如何消费需要阶段启动时做技术调研再定。考虑因素：Vapor Mode 走编译时命令式路径，与传统 VNode 路径存在冲突；富媒体标签（audio/video/bili）需要挂载真实组件，不能只用静态 HTML。中间语法树（AST）方案已经具备，社区 BBCode 库因 CC98 方言程度过高已被否决（详见 UBB 执行计划的技术决策段）。

DoD：给定任意历史帖 Post.content，按 contentType 分流后渲染结果与老前端视觉一致。

参考：`docs/exec-plans/2026-07-08-ubb-migration.md` 阶段 4。

### 阶段 2：登录流程

范围：OIDC `POST /connect/token`，access/refresh token 轮换和过期续期，头部用户菜单（用户名、退出、未读数），接通 user store。

token 基础设施已在 `lib/http.ts`（读写 localStorage、请求注入 Bearer、401 清理），只差登录流程本身。OAuth client_id 走环境变量 `VITE_OAUTH_CLIENT_ID`，不硬编码（见 `docs/security.md`）。

DoD：能登录、token 过期能续、401 能正确退回登录页。

### 阶段 3：核心读闭环

范围：版面主题列表（BoardView）、帖子楼层（TopicView）。

BoardView：消费 boardTopicsQuery，主题卡片（标题、作者、回复数、最后回复），Pager。TopicView：消费 topicPostsQuery，`vue-virtual-scroller` DynamicScroller 处理不定高楼层（引用嵌套、图片、表情），楼层组件（楼层号、LZ 标记、签名档、时间）。

这是最复杂的单页，建议单独留足时间。

DoD：能从首页进入版面、进入帖子、翻页完整浏览，老帖和新帖渲染正常。

### 阶段 4：发现与列表页

范围：每月/每周/历史热门、新帖、推荐、帖子搜索、版面搜索、用户主页。

复用阶段 1 的主题卡片和 Pager 模式。热门页 API `/topic/hot-{type}` 公开。

DoD：匿名加登录态下所有发现类页面可用。

### 阶段 5：用户中心

范围：我的主题、回帖、收藏（含分组管理）、关注、浏览历史、自定义版面。

全部是 `/me/*` 端点，需要登录。

DoD：登录后能查看和管理自己的全部个人数据。

### 阶段 6：写流程

范围：发新主题、回帖、编辑老帖、楼层互动（点赞、收藏、评分、投票）、文件上传。

编辑器用 md-editor-v3，写入一律 contentType=1。编辑老帖时用 ubbToMarkdown 一次性转换。写路径校验按 `Forum/cc98-openapi-test-notes.md` 建议，用一次性账号加专用测试版面验证。

注意 spec 漂移：`/post/basic` 返回 405，`/post/topic/user` 返回 404，接触前以实测为准。

DoD：能发主题、回帖、编辑老帖、点赞收藏，富文本和图片上传正常。

### 阶段 7：实时交互与消息

范围：私信、通知（@我、回复、系统）、关注、签到。

`@microsoft/signalr` 接现有 hub 做未读推送。

DoD：私信收发、通知实时到达、签到可用。

### 阶段 8：主题、活动与收尾

范围：29 套节日主题 CSS 变量映射、年度总结页、全站管理（版主：锁帖、置顶、高亮、移动）、首页 v2、错误页、IP 查询等边缘页。

优先级最低。

## 非目标

- 不修改后端
- 不迁移老项目 React 组件代码，只参考其行为和 API 调用
- 不做 UBB 编辑器（写入一律 Markdown，编辑老帖转 Markdown）
- 不做 Markdown 到 UBB 反向转换
- 移动端适配不在本计划范围，后续单独规划

## 决策记录

- 2026-07-09：建立迁移计划，分 8 阶段。阶段顺序由技术依赖链决定，渲染地基和登录前置。
- 2026-07-09：登录流程排在核心读闭环之前。个别边缘版面匿名可读，但论坛主体内容版面匿名策略不稳定，需要登录才能进入完整可用测试。同时登录是所有个人功能的前置。
- 2026-07-09：UBB Vue 渲染层的输出格式待定。`packages/ubb` 已产出 AST 和 HTML 两路输出，Vue 层消费方式需要结合 Vapor Mode 兼容性和富媒体挂载需求做技术调研。不用 VNode 作为唯一方案，因为 Vapor Mode 走编译时命令式路径，与传统 VNode 路径存在冲突。
