# 依赖与供应链安全

## 锁文件

`pnpm-lock.yaml` 是唯一真相源。提交前确保锁文件与 `package.json` 一致。

## catalog

workspace 通过 `pnpm-workspace.yaml` 的 catalog 集中管理共享依赖版本。新增共享依赖优先进 catalog，避免散落版本号。

`catalogMode: prefer` 表示优先使用 catalog。

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

## 禁止

- 引入带 `postinstall` 执行任意脚本的包（除非审查过）
- 依赖 `git+ssh` 或 github URL（除非无 npm 发布）
