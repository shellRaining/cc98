# @cc98/api

CC98 API 的公共契约包，提供：

- Zod 运行时 schema
- TypeScript 推导类型
- 业务 API 与 OpenID 的 OpenAPI JSON
- 接口目录与验证状态

当前包仍处于契约重建阶段，尚未发布。人工维护入口分为两部分：

- `src/schemas/`：按领域维护 Zod schema，通过 `z.infer` 导出 TypeScript 类型；需要成为稳定 OpenAPI component 的领域 schema 在定义处使用 `.meta({ id })` 声明名称。
- `src/operations/`：维护 operation registry，包括路径、参数、请求体、响应、认证、风险和验证状态。

`vp run generate` 使用 `zod-openapi` 从这两类 TypeScript 源文件生成并格式化三份产物：

- `generated/openapi.json`：业务 API，server 为 `https://api-v2.cc98.org`，默认使用 Bearer 认证。
- `generated/openid.openapi.json`：OpenID，目前包含匿名的 `POST /connect/token`，server 为 `https://openid.cc98.org`。
- `generated/endpoint-catalog.json`：从完整 operation registry 派生的接口目录。

业务 API 与 OpenID 分开生成，避免把不同的 server 和认证语义合并到同一份规范。组件名称与领域 schema 定义放在一起；简单参数和临时包装保持内联。组件引用和可达性由生成库管理，只输出对应 operation 实际可达的 schema。匿名和登录探测直接使用 registry 中的 Zod schema 校验响应。

包测试会在临时目录重新生成两份 OpenAPI 和 endpoint catalog，并与仓库中的 JSON 做结构化比较。因此根目录 `vp run ready` 会拒绝过期生成物，但不会在检查过程中改写工作区。

旧 OpenAPI 已在迁移完成后删除。新增或修正契约时直接维护领域 Zod schema 和 operation registry，不再保留平行的历史规范。

登录接口验证从仓库根目录的 `.cc98-credentials.local` 读取 `CC98_USERNAME` 和 `CC98_PASSWORD`。该文件已被 `*.local` 规则忽略，不会进入版本库；Worktrunk 会按根目录 `.worktreeinclude` 把它复制到新 worktree。浏览器登录自动化也可以使用同一份凭证。

```bash
vp run @cc98/api#probe:authenticated
```

API 探测每次运行时向 OpenID 服务换取短期 access token，不持久化 access token 或 refresh token。bearer token 只写入权限为 `0600` 的临时 header 文件，并通过 `finally` 在正常结束或异常退出时统一删除。普通环境检查不读取或打印凭证。

历史写探测结果保留在 `generated/probe-write.json`。普通注册用户无法删除似水流年版面的测试内容，因此不再提供可重复执行的写探测脚本；获得可清理的测试环境后再重新设计。
