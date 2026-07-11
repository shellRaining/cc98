# 依赖与供应链安全

## 锁文件

`pnpm-lock.yaml` 是唯一真相源。提交前确保锁文件与 `package.json` 一致。

## catalog

workspace 通过 `pnpm-workspace.yaml` 的 catalog 集中管理共享依赖版本。新增共享依赖优先进 catalog，避免散落版本号。

`catalogMode: prefer` 表示优先使用 catalog。当前 catalog 管理的核心依赖见该文件，包括 vue / vue-router / pinia / @tanstack/vue-query / reka-ui / unocss / ofetch / zod 等。

`packages/api` 使用 Zod 维护运行时契约，并由 `zod-openapi` 生成 OpenAPI 3.1 文档和可达组件引用。稳定 component ID 通过领域 schema 定义处的 `.meta({ id })` 维护，不另建集中映射。项目不自行实现 Zod 到 OpenAPI 的转换，也不引入 JSON Schema 到 Zod 的运行时转换依赖。

项目当前使用 Zod 4。对象 schema 优先使用 `z.object()`、`z.looseObject()` 和 `z.strictObject()` 明确表达 strip、保留未知字段和拒绝未知字段三种行为，不使用 legacy 的 `.passthrough()` 或 `.strict()` 链式方法。schema 自身的 OpenAPI 元数据使用 `schema.meta()`；只有元数据无法与定义放在一起或需要跨模块统一管理时，才使用 `z.globalRegistry`。

## 工具库优先

写工具函数前先查：

- @vueuse/core：Vue Composition API 工具（useStorage / useEventListener / useDebounceFn / useIntersectionObserver / useClipboard / useScroll 等）
- @vueuse/integrations：与其他库的桥接（fuse.js / jwt-decode / focus-trap 等）
- dayjs：时间格式化（替代 moment，老项目用 moment）
- nanoid：id 生成
- clsx：class 合并（配合 UnoCSS 和 Reka UI）

只有上面都没有合适实现时，才在 `packages/utils` 写自研工具，并配测试。

## 引入新依赖前检查

1. 是否真的需要？能否用现有代码或更小的库替代？
2. 维护活跃度（最近 commit、issue 响应）
3. 体积与 tree-shaking 友好度
4. 许可证兼容性
5. 是否有已知 CVE（`pnpm audit`）

偏好无聊且稳定的依赖，agent 更容易建模，API 稳定，训练集覆盖也好。

## 升级策略

- patch / minor：随常规改动顺手升级
- major：单独 PR，先在 CI 验证
- 定期跑 `pnpm audit` 处理漏洞
