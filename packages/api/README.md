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

## 同步到 Apifox

Apifox 是仓库契约的只读投影，修改接口时仍应编辑 `src/schemas/` 或 `src/operations/`，再重新生成规范。不要只在 Apifox 中修改接口定义。

```bash
vp run @cc98/api#apifox:check
vp run @cc98/api#apifox:sync
vp run @cc98/api#apifox:verify
```

`apifox:check` 检查生成物、CLI 版本、登录状态、项目、主分支和模块配置，不修改云端。`apifox:verify` 回读两个受管模块，比较接口集合、operationId、认证、服务地址和 token 表单。两条命令都不会请求真实 CC98 API。

`apifox:sync` 会修改 Apifox 主分支。它先清理受管模块中的残留和重复资源，再导入主 API。OpenID 规范会先转换成 Apifox 原生格式，通过模块映射写入独立模块；转换时产生的主模块临时接口和 OpenID 专用模型会在同一次运行中清理。同步结束后命令会自动回读验证，受管范围只包括 `apifox.config.json` 声明的两个模块。

首次使用前运行：

```bash
vp exec -F @cc98/api apifox auth login
```

登录信息由 Apifox CLI 保存到用户配置，仓库不保存 token。删除主分支已有资源需要 Apifox 客户端 2.8.32 或更高版本，并在项目设置的 AI 功能设置中开启外部 AI 编辑权限。只需允许 CLI 或 MCP 修改主分支，迭代分支和通用分支权限可以保持关闭。CLI 返回限制时，`apifox:sync` 会在导入前停止并保留官方处理指引。
