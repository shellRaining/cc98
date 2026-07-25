# 修复 PWA 部署后的版本漂移

## 背景

网站使用路由懒加载和带内容哈希的构建产物。生产部署切换后，旧标签页仍会按上一版入口代码请求懒加载资源。当前 Vercel 配置把缺失的 `/assets/*` 请求改写成 `index.html`，响应同时继承静态资源的一年期缓存头。浏览器会收到 `200 text/html`，Service Worker 也可能把这份响应写入脚本缓存，最终由 Vue Router 记录为路由异常。

Service Worker 通过 `useRegisterSW` 在页面加载时注册。应用没有主动调用 `ServiceWorkerRegistration.update()`，长时间打开的标签页通常要等到刷新或浏览器自行检查后才会显示更新提示。

## 目标

- 缺失的静态资源返回错误响应，不再回退到 `index.html`。
- 已访问的带哈希脚本、样式和字体在新部署后仍可从 Cache Storage 使用。
- 页面重新可见、恢复联网和持续打开期间主动检查 Service Worker 更新。
- 懒加载资源失效时显示更新提示，避免页面只留下路由异常。
- 保留用户确认后再刷新页面的更新流程。

## 非目标

- 不预缓存全部路由资源。
- 不接入 Vercel Skew Protection 或自行改写构建资源 URL。
- 不改变 API、图片和第三方媒体的缓存边界。
- 不自动刷新正在编辑内容的页面。

## 方案

Vercel 的 SPA 回退明确排除 `/assets/*`、Service Worker、Manifest 和固定 PWA 文件。业务路由仍返回 `index.html`，缺失静态文件交给 Vercel 返回 404。

脚本、样式和字体已经带内容哈希，运行时缓存改用 `CacheFirst`。缓存写入同时检查状态码和响应类型，HTML、错误页与类型不匹配的响应不能进入缓存。使用新的缓存名，避免复用已经可能被污染的条目。

PWA 状态组件保存注册结果，通过一个带并发合并和最小检查间隔的更新检查器调用 `registration.update()`。检查由页面重新可见、网络恢复和一小时定时器触发。Vite 的 `vite:preloadError` 会阻止未处理异常，标记当前版本已经失效，并立即检查 Service Worker。用户确认更新时等待新 Worker 进入 waiting 状态；没有可激活的新 Worker 时再回退到普通页面刷新。

## 实施步骤

- [x] 修正 Vercel SPA 回退范围，补配置契约测试。
- [x] 调整带哈希资源的运行时缓存策略和响应校验。
- [x] 加入主动更新检查与懒加载失败处理。
- [x] 补并发、节流、Worker 等待和缓存响应的回归测试。
- [x] 同步前端缓存规范和执行计划索引。
- [x] 运行全量检查、生产构建和浏览器更新场景验证。

## 验证

- `vp run ready` 全量通过，网站 34 个测试文件共 299 项测试通过。
- 构建后的 `sw.js` 使用新的 `CacheFirst` 资源缓存，并包含状态码和 Content-Type 校验。
- 本地生产预览的首页、页面切换和深层路由刷新正常。
- 模拟 `vite:preloadError` 后出现版本失效提示，“稍后”关闭提示，“立即更新”只触发一次重新加载。
- Vercel Preview 中缺失 `/assets/definitely-missing-version.js` 返回 `404 text/plain`，业务深层路由返回 `200 text/html`，`sw.js` 返回 `200 application/javascript` 并保持 `max-age=0, must-revalidate`。
- 更新检查器的回归测试覆盖并发合并、节流、强制检查和 Worker 等待状态。

## 进展与调整

- 2026-07-26：从远端 `main` 创建 `fix/pwa-version-skew` worktree。主 worktree 有用户未提交修改，本任务没有读取或覆盖这些修改。
- 2026-07-26：实现 Vercel 路由排除、`CacheFirst` 资源缓存、响应类型校验、主动更新检查和预加载失败提示，新增 8 项回归测试。
- 2026-07-26：`vp run ready` 全量通过。生产预览中首页、页面切换和深层路由刷新正常；模拟 `vite:preloadError` 后能显示版本失效提示，“稍后”和“立即更新”行为符合预期。
- 2026-07-26：本地 Vite Preview 会自行把缺失资源回退到 `index.html`，因此在 PR #44 的 Vercel Preview 完成最终路由验收。缺失脚本返回 404 且不是 HTML，业务路由和 Service Worker 响应正常。

## 结果

部署切换后，已经访问过的带哈希资源可以继续从 Cache Storage 使用。未访问资源已经被新部署移除时，Vercel 不再用首页 HTML 冒充脚本响应，页面会显示明确的版本失效提示。长时间打开的标签页也会在重新可见、恢复联网和每小时定时检查时主动发现更新。

根目录 `README.md` 的表格变化来自 `vp check --fix` 对主分支近期内容的格式化，没有改变文意。

## 遗留项

当前没有影响本计划交付的遗留项。Vercel Skew Protection 仍属于独立的可选增强，不纳入本次修复。

## 决策记录

- 不依赖 Service Worker 内部定时器。Worker 会被浏览器挂起，更新检查由受控页面发起。
- 不自动刷新 chunk 加载失败的页面。论坛存在发帖和编辑流程，刷新继续由用户确认。
- 继续按需缓存访问过的路由，不扩大安装时预缓存范围。
