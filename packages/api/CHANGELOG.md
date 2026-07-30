# 更新记录

本文件记录 `@cc98/api` 对外发布后的契约变化。尚未发布的改动归入“未发布”。

## 未发布

- 建立 Zod-first API 契约和 operation registry。
- 生成主 API 与 OpenID 的 OpenAPI 3.1 JSON 和接口目录。
- 独立托管两份 OpenAPI JSON，并提供脱敏验证记录和网站运行时 schema。
- 补全 Me、Board、Post、Auth、Topic 和首页配置领域的 schema、参数约束、响应模型与中文 OpenAPI 说明。
- 区分版面概要与详情响应，并补充批量查询的去重、缺项和结果顺序约定。
