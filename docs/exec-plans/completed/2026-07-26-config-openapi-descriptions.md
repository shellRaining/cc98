# Config OpenAPI 契约补全

## 背景

PR #48 已修正 `/config/now` 的响应契约，但带 `Config` tag 的 8 个接口仍有字段缺失和说明不足的问题。尤其 `GlobalConfig` 只显式声明了两个字段，无法在 OpenAPI 和 Apifox 中完整展示真实响应。

## 目标

- 以 PR #48 为基线，补齐 8 个 Config 接口已确认的响应字段。
- 使用标准 OpenAPI `description` 补充字段、接口和响应说明。
- 保留 `optional`、`nullable` 和 `looseObject` 的容错语义。
- 重新生成 OpenAPI，并通过现有测试、检查和构建。

## 非目标

- 不新增独立证据文档或字段描述强制测试体系。
- 不请求管理员凭证，不执行公告写入，不验证两个管理接口的成功响应。
- 不引入 `x-apifox-*` 私有扩展。

## 实施步骤

- [x] 从真实匿名响应、旧项目类型和调用点确认字段及用途。
- [x] 补齐 `GlobalConfig`、`IndexColumn`、`Tag`、`DisplayTitle` 等相关 Schema 和字段说明。
- [x] 补充 8 个 operation 的 `summary`、`description` 和响应说明。
- [x] 重新生成 OpenAPI，运行现有 API 测试、生成物检查和仓库质量门槛。

## 验证

- `vp run -F @cc98/api generate`：通过，生成主 API 135 个 operation、115 个 path。
- `vp run -F @cc98/api test`：通过，18 项 API 契约测试全部通过。
- `vp fmt <本次相关文件> --check`：通过。
- `vp check --no-fmt`：通过，282 个文件无 lint、类型错误或警告。
- `vp run -r test`：通过，API、UBB、utils 和 website 测试全部通过。
- `vp run -r build`：通过；website 仍有既存的 chunk 体积提示。
- `vp run ready`：构建完成，但被本次未修改的根 `README.md` 既存格式问题中止；以上等价检查已分别通过。

## 结果与遗留项

- `GlobalConfig` 从 2 个显式字段补齐为真实匿名响应中观察到的 18 个字段，全部带标准 `description`。
- `IndexColumn`、`Tag`、`DisplayTitle` 和 `ServerTimeResponse` 已补充模型与字段说明。
- 8 个 Config operation 已补充中文 `summary`、标准 `description` 和成功响应说明。
- 两个管理读取接口继续保持 `permission-denied`，公告写接口继续保持 `unknown`；成功响应未验证。
- `signInRewards` 的元素仅观察到空对象，用户头衔 `type` 等字段在原项目中未使用，已明确记录无法进一步推断。

## 决策记录

- Zod `.meta({ description })` 生成标准 OpenAPI Schema `description`，Apifox 可直接读取。
- 无法从真实响应或原项目用法可靠推断的含义，明确说明未能推断，不凭字段名补造业务定义。
