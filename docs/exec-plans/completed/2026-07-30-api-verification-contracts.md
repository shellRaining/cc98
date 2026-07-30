# API 响应模型与验证状态校正

## 背景

`GET /topic/basic` 原先复用完整 `Topic` 模型，但线上响应只包含主题批量补全所需的固定基础字段。由于 `Topic` 的全部属性都是可选项，过宽的响应契约和历史空数组探测都无法暴露差异。

部分写接口已经由开发者实际请求成功，但 operation registry 仍保留 `unknown` 等未验证状态。本次以开发者确认和已有真实请求记录为证据，只校正能够确认结果的接口，不把“前端已有调用代码”视为线上验证。

## 目标

- 为 `GET /topic/basic` 建立独立、精确且字段必填的 `BasicTopic` 公共模型。
- 将 `PUT /post/{postId}/like` 及其他有明确请求证据的接口改为准确的验证状态。
- 重新生成 OpenAPI 与 endpoint catalog，并用契约测试和质量门槛防止回归。

## 非目标

- 不从 Apifox 反向覆盖 Zod schema 或 operation registry。
- 不重新发送会修改论坛数据的写请求。
- 不根据调用代码、旧前端声明或失败请求推断接口已经可用。

## 方案

`BasicTopic` 从真实响应中的 `id`、`boardId`、`title`、`state`、`type`、`isInternalOnly`、`isVote` 和 `contentType` 建模，八个字段均为必填。端点响应改为 `BasicTopic[]`，消息补全链路也消费该模型。

验证状态按实际请求结果分类：成功写请求使用 `verified-write`，权限不足的破坏性请求使用 `permission-denied`。Apifox CLI 只用于读取证据，不执行项目同步或论坛写请求。

## 实施步骤

- [x] 新增并导出 `basicTopicSchema`，接入 `/topic/basic` 和网站消息补全链路。
- [x] 增加端点专用响应 fixture 和契约断言，确保 OpenAPI 引用 `BasicTopic` 且八个字段必填。
- [x] 检查 Apifox CLI 可读取的请求记录，并核对仓库已有的真实请求证据。
- [x] 校正有明确证据的 operation，重新生成所有派生产物。
- [x] 运行 `@cc98/api` 针对性测试、静态检查和 `vp run ready`。

## 验证状态结果

| 接口                         | 校正后状态          | 证据                                                                                     |
| ---------------------------- | ------------------- | ---------------------------------------------------------------------------------------- |
| `PUT /post/{postId}`         | `verified-write`    | 已完成的前端迁移计划记录了真实编辑请求成功                                               |
| `PUT /post/{postId}/like`    | `verified-write`    | 开发者确认已实际请求成功                                                                 |
| `POST /topic/{topicId}/post` | `verified-write`    | 已完成的前端迁移计划记录了真实回帖请求成功                                               |
| `DELETE /topic/{topicId}`    | `permission-denied` | 已完成的前端迁移计划记录了真实请求返回 403，说明接口存在，但当前账号没有删除主题所需权限 |

历史证据来自 `docs/exec-plans/completed/2026-07-18-frontend-migration-roadmap.md`。评分、投票、上传等接口缺少无歧义的成功请求记录，本次不改状态。

## 验证

- `vp run @cc98/api#generate`：通过，OpenAPI、endpoint catalog 和探测基线已更新。
- `vp run @cc98/api#test`：通过，共 20 个契约测试。
- `vp node packages/api/scripts/probe.mjs --only=getTopicBasic`：返回 200，非空响应通过新模型校验。
- `vp check`：通过，共检查 458 个格式文件和 282 个 lint、类型文件。
- `vp run ready`：通过，格式、lint、类型、Knip、全部测试和构建均成功。

## 结果与遗留项

`GET /topic/basic` 的 OpenAPI 不再展示线上不会返回的完整 `Topic` 字段，非空真实响应也替换了原来的空数组 fixture。网站通知补全同步改用 `BasicTopic`，消费端与公共契约保持一致。

Apifox CLI 2.2.8 能访问当前 CC98 项目，但 `history`、测试报告、场景和审计日志均未提供可用的成功请求记录，已有两个测试用例的 `requestResult` 也是空值。CLI 的 `history` 实际读取项目审计日志，不能用于查询调试请求历史。后续接口分类仍需开发者明确确认、可保存的响应结果或其他真实请求证据。
