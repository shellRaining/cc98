# UBB 测试与日志基底执行计划

## 背景

当前项目目标是复刻老 CC98 前端。首要工作不是直接迁移 UBB 渲染，而是先建立两块基底：

- `packages/ubb` 的纯逻辑测试体系，用来固定老项目 UBB 解析行为。
- `apps/website` 的日志入口，用成熟库承接控制台日志，后续再扩展上报、脱敏和观测。

老项目 `/Users/shellraining/Documents/Forum` 中 UBB 实现集中在 `Ubb/Core.tsx` 和 `Ubb/UbbCodeExtension.tsx`。它有完整的 token、segment、handler 机制，但 handler 直接返回 ReactNode，并混有播放器、图片工具箱、Markdown、MathJax 等 UI 副作用。新项目是 Vue，因此本计划只抽取解析行为，不迁移 React 渲染模型。

## 非目标

- 本阶段不做 `apps/website` 测试工具层。
- 本阶段不补 `apps/website` 组件测试、路由测试、API mock 测试。
- 本阶段不实现完整 UBB parser。
- 本阶段不做 UBB Vue 渲染组件。
- 本阶段日志不做远端上报、Sentry、OpenTelemetry、脱敏、采样。
- 本阶段不修改老项目源码。

## 工作 1：UBB 纯逻辑测试基底

### 范围

只在 `packages/ubb` 内建立 parser 行为测试的组织方式。测试目标是未来的框架无关 UBB parser，而不是当前 UI 渲染。

### 建议文件结构

```
packages/ubb/
  src/
    index.ts
  tests/
    index.test.ts
    parse-tag-data.test.ts
    parse-segments.test.ts
    fixtures/
      legacy-cases.ts
```

如果测试数量暂时较少，可以先保留 `index.test.ts`，等 case 增多后再拆文件。

### 第一批测试主题

- 标签参数解析：
  - `url=https://cc98.org`
  - `img=1,title="图片标题"`
  - `color=red`
  - 单引号、双引号、逗号分隔、空格忽略。
- segment 构建：
  - 普通文本。
  - 递归标签：`[b]粗体[i]斜体[/i][/b]`。
  - 文本标签：`[code][b]不递归[/b][/code]`。
  - 空标签：`[ac01]`、`[em12][/em12]`。
  - 未闭合标签：`[b]文本` 降级为文本并产生 warning。
  - 孤立结束标签：`文本[/b]` 保留结束标签文本并产生 warning。
  - 未知标签：`[foo]内容[/foo]` 保留为文本并产生 warning。

### 断言方式

- 优先断言 AST/segment 结构，不断言 HTML。
- warning 作为 parser 结果的一部分断言，不直接依赖 `console.warn`。
- fixture 中保留原始 UBB、期望结构摘要和来源说明。

### TDD 约束

仓库质量规范要求 TDD 时主 agent 不同时写测试和实现。后续如果进入红绿重构流程：

- 测试可先由子 agent 或单独任务编写。
- 主 agent 只实现使测试通过的 parser。
- 如需修改测试，必须说明原因并先获得确认。

## 工作 2：日志基底

### 技术选择

使用 `pino`。浏览器阶段只作为 console logger 使用，不引入服务端日志复杂度。

### 入口

新增单一入口：

```
apps/website/src/lib/logger.ts
```

业务代码不直接 import `pino`，统一通过本入口创建 logger。

### API 形态

建议暴露：

```ts
export const logger: Logger;
export function createLogger(scope: string): Logger;
```

使用示例：

```ts
const httpLogger = createLogger("http");
httpLogger.warn({ status }, "API 请求失败");
```

### level 策略

- dev：`debug`
- prod：`warn`
- test：后续如引入 apps 测试，再决定是否静默或 mock

### 第一批接入点

只接最小入口：

- `apps/website/src/lib/http.ts` 的响应错误。
- 后续 UBB parser 可通过注入式 reporter 或 logger scope 接入 warning。

暂不接：

- vue-query 全局错误处理。
- router error。
- 全局 window error / unhandledrejection。
- 远端上报。

### 文档同步

日志属于横切关注点。实现 logger 入口时，同步更新 `ARCHITECTURE.md` 的横切关注点登记，说明：

- 日志入口是 `apps/website/src/lib/logger.ts`。
- 当前输出目标是浏览器 console。
- 后续上报、脱敏、采样都在该入口扩展。

## 推荐提交拆分

1. `test(ubb): 建立 UBB 解析行为测试基底`
   - 只包含 `packages/ubb` 测试组织和第一批 parser 行为测试。
   - 不实现完整 parser，除非明确进入实现阶段。

2. `feat(logger): 加入前端日志入口`
   - 增加 `pino` catalog 依赖。
   - 新增 `apps/website/src/lib/logger.ts`。
   - 最小接入 `http.ts`。
   - 更新 `ARCHITECTURE.md`。

3. `feat(ubb): 实现框架无关 UBB parser`
   - 在前两个完成后启动。
   - 基于第一批测试逐步实现 AST parser。

## 验收标准

- `vp run ready` 通过。
- `packages/ubb` 测试能表达 parser 目标行为。
- 日志入口存在且业务侧不直接依赖 `pino`。
- `ARCHITECTURE.md` 已登记日志横切入口。
- 没有引入 apps 测试工具层。
- 没有引入 UBB Vue 渲染或老项目 React handler。

## 决策记录

- 2026-07-08：测试先聚焦 `packages/ubb` 纯逻辑，不做 `apps/website` 测试基底。
- 2026-07-08：日志允许引入 `pino`，但当前只输出到控制台，不做脱敏和远端上报。
- 2026-07-08：UBB 实现排在测试基底和日志基底之后。
