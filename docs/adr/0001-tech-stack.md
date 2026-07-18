# 0001. CC98 前端复刻技术选型

Date: 2026-07-08
Status: Accepted

Markdown 编辑与渲染两项选型已由 [0002](./0002-markdown-stack.md) 替代，其余决策继续有效。

## 背景

复刻浙江大学 CC98 论坛前端（原项目 `/Forum`，React 16 + Redux + Webpack 4 + UBB）。新前端是 SPA，不能改动后端，必须兼容历史 UBB 帖（占存量 99%）和新 Markdown 帖。构建在现有 Vite+ monorepo 上。

## 决策

| 类别          | 选型                                 | 理由                                                                                                |
| ------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------- |
| 框架          | Vue 3.6 beta（vapor opt-in）         | 项目早期承担 beta 风险换取 Vapor Mode，热点组件优先迁 vapor                                         |
| 客户端状态    | Pinia + persistedstate               | 替代 Redux，Vue 官方推荐，持久化插件替代手写 localStorage                                           |
| 服务端状态    | @tanstack/vue-query                  | 帖子/楼层是"服务端状态"，缓存和去重由它接管，跟 react-query 同 monorepo 同步发版                    |
| 路由          | Vue Router 5                         | SPA，hash 锚点跳转                                                                                  |
| 无头组件      | Reka UI（不带 shadcn-vue）           | 心智模型和 Radix/Base UI 一致；不带 shadcn 避免引入它默认色板/圆角风格，自己写样式                  |
| 原子 CSS      | UnoCSS                               | Anthony Fu（Vue 核心）维护，与 Vite 生态亲和度最高                                                  |
| 虚拟滚动      | vue-virtual-scroller                 | DynamicScroller 专门处理楼层不定高（引用/图片/表情）                                                |
| Markdown 编辑 | md-editor-v3                         | Vue 3 原生组件，内置图片粘贴上传、暗色模式、扩展插槽                                                |
| Markdown 渲染 | markdown-it                          | 比 remark 轻，插件生态成熟                                                                          |
| UBB 渲染      | 自写（`packages/ubb`，只读）         | 历史 49 个 tag handler 用 Vue 重写，只读不做编辑器                                                  |
| UBB→MD 转换   | `packages/ubb` 内 `ubbToMarkdown`    | 编辑老帖时一次性转换                                                                                |
| 数学公式      | KaTeX                                | 比 MathJax 快、包体小                                                                               |
| 媒体播放      | APlayer + DPlayer + hls.js           | file.cc98.org 直链音视频；播放器集成内聚在富内容 `UniverseAudio`、`UniverseVideo` 和 `UniverseBili` |
| 实时通信      | @microsoft/signalr                   | 消息推送，需要后端现有 hub                                                                          |
| HTTP          | ofetch                               | 轻量、现代，Nuxt/Vue 生态原生                                                                       |
| 边界校验      | Zod                                  | API 响应由 `@cc98/api` 公共 schema parse 后才进入业务                                               |
| 工具库        | @vueuse/core + dayjs + nanoid + clsx | 不手写工具函数，优先用 VueUse                                                                       |
| 主题          | CSS 变量 + `data-theme` 属性         | 零成本切换，配合 UnoCSS theme 映射                                                                  |

## 关键约束：UBB 不能跳过

实测后端 `Post.content` 字段原样存 UBB 文本（`[quote][b]...[/b][/quote]`、`[img]...`、`[ac01]` 等），全站几十万帖。`Post.contentType` 实测取值 `{0: UBB, 1: Markdown}`，与 OpenAPI spec 的 `enum: [0, 1]` 一致（之前探测到的 2/4 是 `Topic.contentType`，主题卡片类型，另一个字段）。

策略：读取按 `contentType` 分流（0→UBB 渲染器，1→remark/MDAST 渲染器）；写入一律 contentType=1；编辑老帖时前端做 UBB→MD 一次性转换。后端零改动。

## 备选

- **Vue 3.5 稳定版起步**：风险更小，但放弃 Vapor 先发优势。被推翻，接受 beta 风险。
- **shadcn-vue + Reka UI**：被推翻，shadcn 自带 zinc 色板/圆角风格与论坛视觉语言冲突。
- **Ark UI**：备选无头库，Vue 生态文档相对薄弱。
- **Milkdown**：最初作为备选，已由 ADR 0002 采用。
- **Tanstack Virtual (vue)**：备选虚拟滚动，需要自己处理动态高度。
- **Plyr + howler**：备选播放器，没有弹幕，放弃。
- **axios**：备选 HTTP 库，套一层 vue-query 后与 ofetch 优势差距抹平。

## 后果

正面：

- Vue 3.6 + Vapor，热点组件可逐个迁到 vapor 提升渲染性能
- vue-query 接管服务端状态缓存，楼层/版面切换不再重复请求
- UBB 渲染器独立成包便于单测，媒体播放实现内聚在网站富文本共享 UI 层
- 后端零改动，靠 contentType 分流逐步迁移

负面 / 风险：

- Vue 3.6 beta API 可能在 GA 前变动，需要跟进 release note
- APlayer/DPlayer 单作者维护，组件内聚在 apps/website，锁版本缓解
- UBB 渲染器开发量约 1-2 周，是必做项不做则老帖乱码
- Vue Router 已到 5.x，与文档中常见的 4.x 教程有差异

后续要做：

- UBB 渲染器实现（`packages/ubb`）
- UBB→Markdown 转换器
- 登录流程（OIDC connect/token）
- 楼层虚拟滚动 + Markdown/UBB 渲染
- 29 套节日主题的 CSS 变量映射
