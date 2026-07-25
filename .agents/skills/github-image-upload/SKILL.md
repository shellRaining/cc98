---
name: github-image-upload
description: 使用 gh-image 将本地截图、录屏或其他验证文件上传为 GitHub User Attachments，并嵌入 CC98 仓库的 Issue、PR 正文或评论。用户要求上传、附加、展示或更新 GitHub 上的图片、视频、日志、PDF、压缩包时使用。
---

# 上传 GitHub 附件

使用固定版本的 `drogers0/gh-image` 上传 `.artifacts/browser/` 中的验证证据，再把输出写入指定的 Issue 或 PR。该工具复用 GitHub 网页端的附件上传流程，不会创建 Git commit。

## 上传前确认

1. 确认目标仓库、Issue 或 PR 编号。目标不明确时先询问用户，不要猜测。
2. 检查文件来自本次验证，且不包含密码、Cookie、token、私信、IP 或未脱敏的论坛数据。
3. Issue 展示问题状态，PR 展示修复后的关键状态。截图附近写明观察重点，多步骤交互或动态效果使用录屏。
4. 保留 `.artifacts/browser/` 中的原始文件，不把临时验证产物提交到 Git。

## 准备工具

先检查 GitHub CLI 与登录状态：

```bash
gh auth status
```

项目固定使用 `gh-image v1.2.0`。未安装或版本不符时安装固定版本：

```bash
gh extension install drogers0/gh-image --pin v1.2.0 --force
gh image --version
```

验证浏览器中的 GitHub Session Cookie 可用：

```bash
gh image check-token
```

本地上传默认读取已登录浏览器的 Cookie。不要运行 `gh image extract-token`，不要在命令行使用 `--token`，也不要把 `GH_SESSION_TOKEN` 写进脚本、日志、仓库或个人账号的 CI secret。`user_session` 拥有完整账号权限，应按密码处理。

## 上传文件

使用绝对路径，并显式指定仓库：

```bash
gh image --repo shellRaining/cc98 \
  "/absolute/path/.artifacts/browser/2026-07-26-task/screenshots/result.png"
```

可以在同一条命令中上传多个文件。成功后，每个文件会在标准输出中占一行：

- 图片输出 `![文件名](URL)`，GitHub 内联显示图片。
- 视频输出独立的裸 URL，GitHub 将其渲染为播放器。
- PDF、日志、压缩包等输出 `[文件名](URL)` 下载链接。

如果批量上传中有文件失败，`gh-image` 会继续处理其他文件并以非零状态退出。逐项核对输出，不要为成功的文件重复上传。

## 写入 Issue 或 PR

先读取现有正文或评论上下文，再把上传结果写入 Markdown 文件，通过 `--body-file` 更新，避免多行内容和特殊字符破坏命令参数。修改 PR 正文时保留原有内容；用户只要求补充证据时，优先追加评论，不要改写整份正文。

```bash
gh pr view <number> --repo shellRaining/cc98 --json body --jq .body
gh pr edit <number> --repo shellRaining/cc98 --body-file /absolute/path/pr-body.md
gh pr comment <number> --repo shellRaining/cc98 --body-file /absolute/path/comment.md

gh issue view <number> --repo shellRaining/cc98 --json body --jq .body
gh issue edit <number> --repo shellRaining/cc98 --body-file /absolute/path/issue-body.md
gh issue comment <number> --repo shellRaining/cc98 --body-file /absolute/path/comment.md
```

把视频 URL 单独放在一行。图片附近说明视口、主题、账号权限、复现步骤或观察重点，不能只贴附件地址。

## 验证与收尾

1. 重新读取 Issue 或 PR，确认引用已写入正确位置。
2. 打开页面确认图片或视频完成渲染。公开仓库还要验证匿名访问；私有仓库匿名返回 404 或 403 属于预期行为。
3. 检查 `git status`，确认附件上传没有产生仓库改动。
4. 在交付说明中列出上传目标和附件用途，不输出 Session Cookie 或临时签名 URL。

GitHub 可能在附件被 Issue 或 PR 实际引用前返回 404。附件写入正文或评论后再验证公开访问。

## 存储边界与失败处理

`gh-image` 通过 GitHub 未公开的网页接口申请上传策略，将文件直接写入 GitHub 管理的 S3，再生成 `github.com/user-attachments` 地址。附件不属于 Git 对象，不会进入分支、Tag、Release 或 clone 结果。

GitHub 没有公开的附件删除 API，`gh-image` 也不提供删除命令。删除正文或评论中的引用后，底层文件仍可能继续存在。不要上传秘密、需要确定删除期限的文件或应随源码版本管理的正式资源。

上传成功但写入 Issue 或 PR 失败时，报告已产生的附件 URL，不要自动重复上传。内部接口失效时，可以改用 GitHub 网页端拖放；需要自行控制域名、权限、缓存和删除生命周期时，改用 PicList 配合 S3 或 RustFS。

本流程基于 [`drogers0/gh-image`](https://github.com/drogers0/gh-image) v1.2.0。
