# @cc98/api

CC98 API 的公共契约包。Zod schema 和 operation registry 是事实源，OpenAPI、接口目录和 TypeScript 类型都由它们生成。这个包不提供绑定特定请求库的 SDK，认证、重试、缓存和页面状态由使用方决定。

> 当前版本仍在 monorepo 内验证，尚未发布到公共 registry。公开安装命令会在首个预览版本发布后启用。

## 提供的内容

- Zod 运行时 schema 和通过 `z.infer` 得到的 TypeScript 类型。
- 主业务 API 的 OpenAPI 3.1 JSON 与 YAML。
- OpenID 登录与 Token 刷新的独立 OpenAPI 3.1 JSON 与 YAML。
- 包含认证要求、风险等级和验证状态的接口目录。
- 匿名与登录只读接口的脱敏验证记录。

包导出：

| 导入路径                        | 内容                             |
| ------------------------------- | -------------------------------- |
| `@cc98/api`                     | Zod schema、类型、枚举和公共常量 |
| `@cc98/api/openapi.json`        | 主业务 API OpenAPI JSON          |
| `@cc98/api/openapi.yaml`        | 主业务 API OpenAPI YAML          |
| `@cc98/api/openid.openapi.json` | OpenID OpenAPI JSON              |
| `@cc98/api/openid.openapi.yaml` | OpenID OpenAPI YAML              |
| `@cc98/api/catalog`             | 机器可读接口目录                 |

## 在仓库内使用

拉取代码或进入新 worktree 后运行：

```bash
vp install
vp run @cc98/api#build
```

其他 workspace 包使用 `workspace:*` 依赖 `@cc98/api`。网站直接从包入口导入，不引用 `src/` 或 `generated/` 内部路径。

## 校验响应

下面的例子读取公开版面，并用公共 schema 检查响应。真实接口可能返回权限错误或历史兼容字段，调用方应先检查 HTTP 状态，再解析成功响应。

```ts
import { boardSchema, type Board } from "@cc98/api";

const response = await fetch("https://api-v2.cc98.org/board/1");
if (!response.ok) {
  throw new Error(`CC98 API 返回 ${response.status}`);
}

const board: Board = boardSchema.parse(await response.json());
console.log(board.name);
```

需要自行封装 fetch 时，可以把 schema 作为参数传入，不必为每个接口重复断言类型：

```ts
import type { ZodType } from "zod";

async function getAndParse<T>(url: string, schema: ZodType<T>): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`请求失败：${response.status}`);
  return schema.parse(await response.json());
}
```

## 使用 OpenAPI

生成物可以交给 Apifox、代码生成器、文档工具或其他 OpenAPI 3.1 工具。主 API 与 OpenID 使用不同的 server 和认证语义，不要合并成一个默认 server 不明确的规范。

```ts
import openapi from "@cc98/api/openapi.json" with { type: "json" };

console.log(openapi.info.version);
```

静态 API 文档通过以下命令生成：

```bash
vp run @cc98/api#docs:build
```

输出在 `packages/api/docs/dist/`。`docs:check` 会在临时目录完成同样的构建并检查关键 operation，不改写工作区。

## curl 示例

匿名读取：

```bash
curl --fail --silent --show-error \
  "https://api-v2.cc98.org/config/global"
```

需要登录的接口使用 Bearer token。示例中的 token 只是占位符，不要把真实 token 写入脚本、日志或仓库：

```bash
curl --fail --silent --show-error \
  -H "Authorization: Bearer <access-token>" \
  "https://api-v2.cc98.org/me"
```

OpenID 的 `POST /connect/token` 使用 `application/x-www-form-urlencoded`。账号、密码、client secret、access token 和 refresh token 都属于敏感数据，只能从本地安全存储或运行环境注入。

## 认证、错误与限频

- operation 的 `security` 明确区分匿名和 Bearer 请求，不能只看规范的全局 security。
- 401、403、404、429 和 5xx 不保证使用同一种错误 body。先处理状态码，再按对应 operation 的响应 schema 解析。
- 搜索等接口可能用 403 表示业务限频。客户端应显示可理解的提示并停止立即重试。
- 写入、管理和破坏性接口不进入普通 CI 在线探测。没有隔离资源和清理方案时，不应在生产环境试调用。

## 帖子内容

`POST_CONTENT_TYPE.ubb` 的值为 `0`，`POST_CONTENT_TYPE.markdown` 的值为 `1`。UBB 内容可以交给同仓库的 `@cc98/ubb`：

```ts
import { POST_CONTENT_TYPE, type Post } from "@cc98/api";
import { parseUbb } from "@cc98/ubb";

function parsePostContent(post: Post) {
  if (post.contentType === POST_CONTENT_TYPE.ubb) return parseUbb(post.content ?? "");
  return post.content ?? "";
}
```

`@cc98/ubb` 只负责 UBB 解析与导出，不决定 URL 安全、图片数量或媒体播放策略。这些规则应由最终渲染应用处理。

## 修改契约

- `src/schemas/` 按领域维护 Zod schema。需要稳定 OpenAPI component 名称的 schema 在定义处使用 `.meta({ id })`。
- `src/operations/` 维护 method、path、参数、请求体、响应、认证、风险、来源和验证状态。
- `vp run @cc98/api#generate` 使用 `zod-openapi` 生成两份 JSON、两份 YAML 和接口目录，只输出 operation 可达的 component schema。
- 匿名与登录探测直接使用 registry 中的 Zod schema 校验响应。
- `vp run @cc98/api#test` 在临时目录重新生成产物，并检查结构一致性、静态文档和契约测试，不改写工作区。

旧 OpenAPI、Apifox 和静态文档都不是反向修改入口。发现契约问题时，应修正 Zod schema 或 operation registry，再重新生成。

## 安全边界

登录探测从仓库根目录忽略的 `.cc98-credentials.local` 读取测试账号，每次运行临时换取 access token。token 不持久化，临时请求头文件使用 `0600` 权限并在退出时删除。fixture 必须先脱敏，高隐私响应默认不落盘。

安全问题请按仓库根目录的 `SECURITY.md` 报告，不要在公开 issue 中粘贴 token、密码、私信、IP 或未脱敏响应。
