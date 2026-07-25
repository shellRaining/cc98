# 静态 API 文档

运行以下命令生成可直接部署的静态站点：

```bash
vp run @cc98/api#docs:build
```

输出目录为 `packages/api/docs/dist/`，包含主 API 与 OpenID 的 Redoc 页面、接口目录，以及可下载的 JSON 和 YAML 规范。`docs:check` 在临时目录构建并检查关键 operation，不改写工作区。

生产预览使用 `vp run api-docs:preview`，分支 worktree 的稳定地址为 `http://<branch>.cc98-api-docs-preview.localhost:1355`。

## 发布配置

API 文档使用独立 Vercel 项目，建议项目名为 `cc98-api-docs`，项目根目录设置为 `packages/api/docs`。构建配置位于 `vercel.json`。项目接入 Git 仓库后，PR 生成独立预览，`main` 分支发布到预期生产域名 `https://cc98-api-docs.vercel.app`。`docs/dist/` 是构建产物，不提交到仓库，部署失败不会影响主站和用户帮助站。

规范直链：

- `https://cc98-api-docs.vercel.app/openapi.json`
- `https://cc98-api-docs.vercel.app/openapi.yaml`
- `https://cc98-api-docs.vercel.app/openid.openapi.json`
- `https://cc98-api-docs.vercel.app/openid.openapi.yaml`

Apifox 应分别绑定主 API 和 OpenID 两个 URL 数据源，并为它们选择不同的目标模块。模块、目录、冲突策略、Security Scheme、Server 和删除源中不存在资源等规则交给 Apifox 的数据源导入配置维护，仓库不再提供 CLI 同步脚本。
