# 应用安全

## Secrets

- 密钥不入库。`.gitignore` 已排除 `*.local`、`.claude/worktrees/` 等。
- 敏感配置走环境变量，前缀 `VITE_` 仅限真正需要暴露给前端的项。
- 新增敏感文件路径时同步更新 `.gitignore`。
