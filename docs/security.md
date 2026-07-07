# 应用安全

## Secrets

- 密钥不入库。`.gitignore` 已排除 `*.local`、`.claude/worktrees/` 等。
- 敏感配置走环境变量，前缀 `VITE_` 仅限真正需要暴露给前端的项。
- 新增敏感文件路径时同步更新 `.gitignore`。

## 前端安全

- 用户输入到渲染前必须转义（框架默认行为，避免用 `dangerouslySetInnerHTML`，除非内容已经净化过）。
- 外部数据通过 parse at boundary 验证形状后再用。
- 跨域资源走 CORS 白名单，不开放通配。

## 依赖

见 `docs/dependency.md`。

## 上报

发现漏洞按安全流程处理（如建立专门流程时在本文件登记）。
