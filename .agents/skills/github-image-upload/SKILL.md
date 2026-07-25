---
name: github-image-upload
description: 使用 gh-image 将本地图片、视频或其他文件上传为 GitHub User Attachments，并嵌入任意 GitHub 仓库的 Issue、PR 正文或评论。用户要求上传、附加、展示或更新 GitHub 上的截图、录屏、日志、PDF、压缩包时使用。
---

# 上传 GitHub 附件

使用 `drogers0/gh-image` 复用 GitHub 网页端的附件上传流程，获得可直接写入 Issue 或 PR 的引用。上传不会创建 Git commit。

## 上传前确认

1. 确认目标仓库、Issue 或 PR 编号。目标不明确时先询问用户，不要猜测。
2. 确认当前账号对目标仓库有写权限。
3. 检查文件不包含密码、Cookie、token 或其他不应上传到目标仓库的内容。
4. 修改现有正文前先读取原文，保留无关内容。

## 准备工具

检查 GitHub CLI 与登录状态：

```bash
gh auth status
```

检查 `gh-image`，仅在尚未安装时添加扩展：

```bash
gh extension list
gh extension install drogers0/gh-image
gh image --version
```

验证用于上传的 GitHub Session Cookie：

```bash
gh image check-token
```

`gh-image` 的上传接口不接受普通 `gh` token，本地使用时默认读取已登录浏览器的 `user_session` Cookie。该 Cookie 拥有完整账号权限，应按密码处理。不要输出或记录它，也不要在共享机器上通过 `--token` 传递，因为命令参数可能出现在进程列表中。

只有用户明确要求在 CI 或无浏览器环境上传时，才考虑 `GH_SESSION_TOKEN`。使用专用机器人账号，将值存入受限 secret，不要使用个人账号的 Session Cookie。

## 上传文件

使用绝对路径，并显式指定目标仓库：

```bash
gh image --repo owner/repo "/absolute/path/result.png"
```

可以在同一条命令中上传多个文件。成功后，每个文件会在标准输出中占一行：

- 图片输出 `![文件名](URL)`，GitHub 内联显示图片。
- 视频输出独立的裸 URL，GitHub 将其渲染为播放器。
- PDF、日志、压缩包等输出 `[文件名](URL)` 下载链接。

如果批量上传中有文件失败，`gh-image` 会继续处理其他文件并以非零状态退出。逐项核对输出，不要为成功的文件重复上传。

## 写入 Issue 或 PR

将上传结果写入 Markdown 文件，再通过 `--body-file` 更新目标，避免多行内容和特殊字符破坏命令参数。修改正文时保留原有内容；用户只要求补充附件时，优先追加评论。

```bash
gh pr view <number> --repo owner/repo --json body --jq .body
gh pr edit <number> --repo owner/repo --body-file /absolute/path/pr-body.md
gh pr comment <number> --repo owner/repo --body-file /absolute/path/comment.md

gh issue view <number> --repo owner/repo --json body --jq .body
gh issue edit <number> --repo owner/repo --body-file /absolute/path/issue-body.md
gh issue comment <number> --repo owner/repo --body-file /absolute/path/comment.md
```

把视频 URL 单独放在一行。图片或文件附近补充必要说明，不能只贴没有上下文的附件地址。

## 验证与收尾

1. 重新读取 Issue 或 PR，确认引用位于正确位置。
2. 打开页面确认图片、视频或下载链接可用。
3. 公开仓库可以补充匿名访问验证；私有仓库匿名返回 404 或 403 属于预期行为。
4. 在 Git 工作区内操作时检查 `git status`，确认上传没有产生仓库文件改动。
5. 交付时说明上传目标和附件用途，不输出 Session Cookie 或临时签名 URL。

GitHub 可能在附件被 Issue 或 PR 实际引用前返回 404。先把引用写入目标，再验证公开访问。

## 存储边界与失败处理

`gh-image` 通过 GitHub 未公开的网页接口申请上传策略，将文件直接写入 GitHub 管理的对象存储，再生成 `github.com/user-attachments` 地址。附件不属于 Git 对象，不会进入分支、Tag、Release 或 clone 结果，其可见性跟随目标仓库。

GitHub 没有公开的附件删除 API，`gh-image` 也不提供删除命令。删除正文或评论中的引用后，底层文件仍可能继续存在。不要上传秘密、需要确定删除期限的文件或应随源码版本管理的正式资源。

上传成功但写入 Issue 或 PR 失败时，报告已产生的附件 URL，不要自动重复上传。内部接口失效时，可以改用 GitHub 网页端拖放；需要自行控制域名、权限、缓存和删除生命周期时，改用受控对象存储。

工具来源：[`drogers0/gh-image`](https://github.com/drogers0/gh-image)。
