# CC98 论坛

agent-first 工作流：人设计环境和意图，agent 执行。这份文件是目录（TOC），不是百科全书，深度内容在 docs/ 下，按需加载，省 context。

方法论见 docs/core-beliefs.md。

## 常用命令

- `vp install`：拉完远程变更先跑
- `vp run ready`：format + lint + typecheck + test + build，提交前必跑
- `vp run dev`：启动 apps/website 开发服务器

## 何时读什么

开工前：

- `ARCHITECTURE.md`：顶层架构地图和分层边界
- `docs/core-beliefs.md`：agent-first 操作铁律
- `docs/collaborating.md`：分支、提交、PR、Review、文档同步

收尾前：

- `docs/quality.md`：代码质量门槛（lint / 类型 / 测试）

按需：

- `docs/frontend.md`：前端工程规范
- `docs/design.md`：UI/UX 设计系统
- `docs/security.md`：应用安全（XSS / CSRF / auth / secrets）
- `docs/dependency.md`：依赖和供应链安全
- `docs/adr/`：架构决策记录，遇到重大架构抉择时写一条

后端 / 数据库规范暂未建立，本项目目前无后端。要引入薄 API wrapper 层时，先建 `docs/backend.md` 和 `docs/database.md`，再补进上面这张表。

## 仓库布局

```
apps/website              Vue 3.6 SPA（论坛前端）
packages/utils            可复用 TypeScript 工具
packages/ubb              UBB 渲染器（只读）+ UBB→Markdown 转换器
```

依赖方向：`packages → apps` 允许，反向禁止。详见 `ARCHITECTURE.md`。

## 核心约束

- 边界处 parse data shapes：用 Zod，schema 在 `apps/website/src/api/schemas.ts`
- HTTP 一律走 `apps/website/src/lib/http.ts` 的 `apiFetch`（ofetch 实例），不在组件里直接 fetch
- 服务端状态走 vue-query（query key 集中在 `api/queries.ts`），客户端状态走 Pinia，不混用
- 用户内容渲染前必须净化（Markdown 走 markdown-it + sanitizer，UBB 走受控渲染器，纯文本转义）
- 媒体播放（APlayer/DPlayer/B站 iframe）组件在 `apps/website/src/components/media/`，UBB/Markdown 渲染时按需引用
- 工具函数优先用 VueUse / dayjs / clsx / nanoid，不手写轮子
- 文档和代码同源：改公共 API、架构边界、核心约束，必须同次更新对应 `docs/`
- 复杂工作先写执行计划，不在 chat 里堆上下文
