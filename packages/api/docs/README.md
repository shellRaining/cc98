# 静态 API 文档

运行以下命令生成可直接部署的静态站点：

```bash
vp run @cc98/api#docs:build
```

输出目录为 `packages/api/docs/dist/`，包含主 API 与 OpenID 的 Redoc 页面、接口目录，以及可下载的 JSON 和 YAML 规范。`docs:check` 在临时目录构建并检查关键 operation，不改写工作区。

`docs/dist/` 是构建产物，不提交到仓库。部署时可以单独上传该目录，失败不会影响主站产物。
