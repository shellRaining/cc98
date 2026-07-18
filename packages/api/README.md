# @cc98/api

CC98 API 的公共契约包，提供：

- Zod 运行时 schema
- TypeScript 推导类型
- OpenAPI JSON
- 接口目录与验证状态

当前包仍处于契约重建阶段，尚未发布。人工维护入口分为两部分：

- `src/schemas/`：按领域维护 Zod schema，通过 `z.infer` 导出 TypeScript 类型；需要成为稳定 OpenAPI component 的领域 schema 在定义处使用 `.meta({ id })` 声明名称。
- `src/operations/`：维护 operation registry，包括路径、参数、请求体、响应、认证、风险和验证状态。

`vp run generate` 使用 `zod-openapi` 从这两类 TypeScript 源文件生成并格式化 `generated/openapi.json`，并从 registry 派生 `generated/endpoint-catalog.json`。组件名称与领域 schema 定义放在一起；简单参数和临时包装保持内联。组件引用和可达性由生成库管理，只输出 operation 实际可达的 schema。匿名和登录探测直接使用 registry 中的 Zod schema 校验响应。

包测试会在临时目录重新生成 OpenAPI 和 endpoint catalog，并与仓库中的 JSON 做结构化比较。因此根目录 `vp run ready` 会拒绝过期生成物，但不会在检查过程中改写工作区。

旧 OpenAPI 已在迁移完成后删除。新增或修正契约时直接维护领域 Zod schema 和 operation registry，不再保留平行的历史规范。

登录接口验证从仓库根目录的 `.cc98-credentials.local` 读取 `CC98_USERNAME` 和 `CC98_PASSWORD`。该文件已被 `*.local` 规则忽略，不会进入版本库；Worktrunk 会按根目录 `.worktreeinclude` 把它复制到新 worktree。浏览器登录自动化也可以使用同一份凭证。

```bash
vp run @cc98/api#probe:authenticated
```

API 探测每次运行时向 OpenID 服务换取短期 access token，不持久化 access token 或 refresh token。bearer token 只写入权限为 `0600` 的临时 header 文件，并通过 `finally` 在正常结束或异常退出时统一删除。普通环境检查不读取或打印凭证。

历史写探测结果保留在 `generated/probe-write.json`。普通注册用户无法删除似水流年版面的测试内容，因此不再提供可重复执行的写探测脚本；获得可清理的测试环境后再重新设计。
