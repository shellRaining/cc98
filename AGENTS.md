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
apps/       面向用户的应用（website）
packages/   可复用的库（utils）
```

依赖方向：`packages → apps` 允许，反向禁止。详见 `ARCHITECTURE.md`。

## 核心约束

- 边界处 parse data shapes（Zod / valibot 都行，不指定具体库）
- 文档和代码同源：改公共 API、架构边界、核心约束，必须同次更新对应 `docs/`
- 复杂工作先写执行计划，不在 chat 里堆上下文
