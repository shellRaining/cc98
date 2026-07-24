# 皮肤横幅 PWA 分层缓存

## 背景

皮肤横幅位于 `apps/website/src/assets/themes/`，经过 Vite 构建后带有内容哈希。首页只加载当前皮肤的正式横幅，不会一次下载全部皮肤。现有部署没有为 `/assets/*` 配置长期缓存头，也没有 Service Worker。浏览器因此可能在重复访问时继续等待网络重新验证，弱网或短暂离线时也无法直接使用已经访问过的横幅。

这次先建立静态资源和 PWA 的缓存地基。带哈希资源由 HTTP 长缓存负责，最小 App Shell 和访问过的皮肤横幅由 Cache Storage 负责。图片仍保留当前格式和质量，不把资源压缩、格式转换与缓存行为混在同一轮验收。

## 目标

- `/assets/*` 使用一年期 `immutable` 缓存，HTML 和 Service Worker 保持可重新验证。
- 接入与当前 Vite+ 构建链兼容的最小 Service Worker。
- 只预缓存应用启动所需的最小 App Shell，不预缓存全部皮肤和懒加载页面。
- 访问过的正式横幅进入独立运行时缓存，离线时仍能显示。
- 缓存有明确上限，新横幅通过内容哈希自然更新。
- Service Worker 或缓存不可用时，在线加载和纯色头部降级保持正常。

## 非目标

- 不压缩正式横幅，不转换 WebP 或 AVIF。
- 不使用 localStorage、Base64 或 IndexedDB 保存静态图片。
- 不在安装阶段下载全部皮肤资源。
- 不实现离线 API 数据、发帖、后台同步、推送、安装提示或更新界面。
- 不承诺用户首次访问时离线可用。

## 方案

优先验证 `vite-plugin-pwa` 的 `generateSW` 模式。第一期不提供 Web App Manifest，插件只负责生成和注册 Service Worker。若插件无法与 Vite+ 稳定构建，再回退到原生 Service Worker；是否回退以本地生产构建结果为准。

App Shell 只包含 `index.html`、favicon、Service Worker 注册脚本、全局入口和首页路由实际依赖的脚本、样式及小型界面图片。其他路由的懒加载 chunk、皮肤横幅和卡片预览图不进入预缓存。构建后检查 precache manifest，避免文件名规则把大批资源误纳入缓存。

正式横幅使用 `CacheFirst`：

- 只匹配同源 `assets/banner-<hash>.jpg` 与 `assets/banner-dark-<hash>.jpg`。
- 排除 `banner-card-<hash>.jpg`。
- 只缓存状态为 `200` 且 `Content-Type` 为 `image/jpeg` 的响应。
- 使用独立缓存名 `skin-images-v1`。
- 最多保留 12 个响应，存储配额不足时允许 Workbox 清理。

正式横幅均由内容哈希区分版本。发布新图片后，页面引用会指向新 URL；旧响应按条目上限逐步淘汰，不另建版本表，也不把 Cache Storage 当成业务数据库。

## 实施步骤

### 阶段 1：固定范围和兼容性验证

- [x] 更新 Issue #21，移除横幅压缩实施项。
- [x] 加入 PWA 构建依赖并完成最小生产构建。
- [x] 检查生成的 Service Worker、入口 HTML 和 precache manifest。

### 阶段 2：实现分层缓存

- [x] 配置 `/assets/*` 的长期缓存头，并让 HTML 与 Service Worker 保持重新验证。
- [x] 收敛最小 App Shell 预缓存规则。
- [x] 实现正式横幅的 `CacheFirst` 运行时缓存与条目淘汰。
- [x] 确认正式横幅、卡片预览图和懒加载 chunk 没有被批量预缓存。

### 阶段 3：生产验收和收尾

- [x] 运行 `vp run ready`。
- [x] 通过 `vp run preview` 验证普通访问、二次访问、离线刷新、换肤和新哈希更新。
- [x] 检查横幅响应不可显示时仍保留纯色头部。
- [x] 补齐结果、验证记录和遗留项，归档本计划并同步索引。

## 验证

构建检查需要记录 Service Worker 输出、预缓存条目和横幅匹配结果。预缓存中不得包含 `banner*.jpg`、`banner-card*.jpg` 或大批路由懒加载 chunk。

浏览器使用生产预览验证：首次访问只下载当前正式横幅；Service Worker 激活后再次访问可以命中运行时缓存；离线刷新能打开 App Shell 并显示已访问横幅；切换到未访问皮肤时在线请求并写入缓存；带新内容哈希的横幅不会被旧响应覆盖。验证证据保存在 `.artifacts/browser/2026-07-24-pwa-skin-cache/`，不提交仓库。

## 风险与回滚

- `vite-plugin-pwa` 可能与 Vite+ 的 Rolldown 构建存在兼容问题。兼容性验证失败时停止引入插件，改用小型原生 Service Worker，避免带着不稳定构建进入实现阶段。
- 预缓存规则过宽会放大首次安装流量。每次构建都检查生成清单，并以生产 HTML 的实际入口依赖为准。
- Service Worker 缓存会跨刷新保留。回滚时删除注册入口并发布新的 Service Worker 清理本次缓存，HTTP 缓存仍可独立工作。

## 进展与调整

- 2026-07-24：创建独立 worktree 和 `feature/pwa-skin-cache` 分支。用户确认第一期实施，但明确排除正式横幅压缩。
- 2026-07-24：`vite-plugin-pwa@1.3.0` 可以在 Vite+ 0.2.4 下完成生产构建。生成的 Service Worker 使用内联 Workbox 运行时，不额外产生需要更新检查的 Workbox 脚本。
- 2026-07-24：首轮构建的预缓存只有首页 HTML、favicon、注册脚本、入口 JS/CSS 和两个 modulepreload。正式横幅、卡片预览图与路由懒加载 chunk 均未进入清单。
- 2026-07-24：首次离线刷新发现首页本身也是懒加载路由，只有全局入口时会缺少 `HomeView` 和 `HomeSectionHeader`。App Shell 调整为包含首页路由的实际依赖，仍排除其他页面的懒加载资源。
- 2026-07-24：浏览器提取实际构建 URL 后发现首版正则会把 `banner-card-*` 的 `card-*` 误当成哈希。运行时路由改为显式排除 `banner-card` 和 `banner-card-dark`。
- 2026-07-24：生产预览会把不存在的静态资源回退到 `index.html`，响应状态仍为 `200`。缓存条件增加 JPEG 内容类型检查，避免把 HTML 错存成横幅。
- 2026-07-24：rebase 到最新主线后，论坛统计组件新增 19 套皮肤雪球君。App Shell 移除雪球君通配规则，避免把整套皮肤图片纳入预缓存。

## 实施结果

- Vercel 为 `/assets/*` 下的带指纹资源发送一年期 `immutable` 缓存头；HTML、`sw.js` 和 `registerSW.js` 保持重新验证。
- `vite-plugin-pwa@1.3.0` 以 `generateSW` 模式生成单文件 Service Worker，第一期不提供 Web App Manifest 和安装界面。
- App Shell 预缓存 15 项，覆盖首页启动链路，没有包含正式横幅、卡片预览图、皮肤雪球君或其他路由的懒加载 chunk。
- 正式横幅使用 `skin-images-v1` 和 `CacheFirst`，只接受 JPEG `200` 响应，最多保留 12 项。
- `docs/frontend.md` 已记录 HTTP 缓存、App Shell、Cache Storage 和 IndexedDB 的职责边界。

## 验证记录

- `vp run ready` 通过：格式、lint、类型、Knip、全量构建和全量测试成功。网站 30 个测试文件、285 个测试通过。
- 生产构建生成 `sw.js` 和 `registerSW.js`。预缓存清单共 15 项，正式横幅、卡片预览图、皮肤雪球君和其他 `*View` 路由 chunk 数量均为 0。
- Chromium 生产预览确认：首次访问只请求夏季正式横幅；第二次访问建立 `skin-images-v1`；离线刷新能加载 App Shell 和 196076 字节的已访问横幅；API 数据进入既有错误状态，没有路由 chunk 异常。
- 顺序访问 22 个正式横幅后缓存保留 12 项。`banner-card-*`、不存在的横幅和 `text/html` 回退响应均未进入缓存。
- `vp pm audit --json` 仍报告仓库原有依赖漏洞，但没有发现路径包含 `vite-plugin-pwa`、Workbox 或 `@vite-pwa` 的新增告警。
- 浏览器证据位于 `.artifacts/browser/2026-07-24-pwa-skin-cache/`。

## 遗留项

- 本机 Safari 26.5 没有启用“允许远程自动化”，agent-browser 的 iOS provider 也缺少 Xcode Simulator，本轮无法提供 WebKit 自动化证据。发布前可在已启用远程自动化的 Safari 中补一次安装、离线刷新和缓存清理抽查。
- 第一阶段不提供 Service Worker 更新提示。新版本会在旧页面全部关闭后接管，后续做完整 PWA 安装体验时再统一设计更新界面。

## 决策记录

- 静态图片使用 Cache Storage，不引入 IndexedDB 或 VueUse 持久化封装。
- 第一阶段只缓存访问过的正式横幅，不预取所有皮肤。
- 图片优化单独评估，避免缓存实现同时改变视觉质量和资源格式。
