# 代码质量

提交前必须通过的门槛。

## 提交门槛

```bash
vp run ready # 等价于 vp check（format + lint + typecheck）+ vp run -r test + vp run -r build。任一失败就不能提交。
```

pre-commit 钩子（`.vite-hooks/pre-commit`）跑 `vp staged` 处理暂存区，对暂存区文件跑 format + lint + typecheck 的增量检查

## 测试

项目使用 Vitest 框架进行测试

### TDD 测试

如果需要进行 TDD 测试，有以下几项规定：

1. 禁止主 agent 同时编写测试和实现代码。应让另一个 agent（比方说派遣一个子 agent）去编写测试代码，然后由主 agent 进行实现。
2. 禁止为了通过测试而直接修改测试代码。如果确实需要修改测试代码，必须向开发者讲清原因。
3. 禁止编写显而易见的测试代码。值得测的是有分支、有状态、有边界的逻辑，比方说懒刷新的并发去重等。TDD 适合内部逻辑复杂、外部可观察的任务

### 端到端验证

需要用浏览器实际登录、点击、验证接口可达性时，先复用已在运行的 dev server，不要重复启动。

- 先探测默认端口 5173 是否在运行：`lsof -i :5173` 或 `curl -s -o /dev/null -w "%{http_code}" localhost:5173`。
- 已在运行就直接用（`http://localhost:5173`），不要新起实例。
- 仅当确认未运行时才 `vp run dev`，并记下实际端口（可能因占用自动换成 5174 等）。
- 验证完毕若自己启动了 server，负责关闭它，不留后台进程。

## 代码质量约束

- 公共 API 必须有类型导出（`export type` / `export interface`）
- API 响应一律经 Zod schema parse（`api/schemas.ts`），不裸用 `any`
- query key 集中在 `api/queries.ts` 的 `queryKeys`，mutation 完成后 invalidate 相关 key
- HTTP 一律走 `lib/http.ts` 的 `apiFetch`，不在组件里直接 `fetch` / `ofetch`
- 客户端状态进 Pinia，服务端状态进 vue-query，不混用
- 组件里不硬编码颜色值，用 UnoCSS 语义 class（`text-cc98-*`）或 CSS 变量
- 路由级组件懒加载（`() => import(...)`）
- 重依赖（KaTeX、播放器、编辑器）按需 import，不进主 bundle
- 工具函数优先用 VueUse / dayjs / clsx / nanoid，不手写轮子
