# 前端工程规范

适用于 `apps/*`。

## 技术栈

Vite + TypeScript。构建经 `vp build`（内部调用 Vite）。预览经 `vp preview`。

## 模块

nodenext 模块解析。导入带 `.ts` 扩展名（`allowImportingTsExtensions: true`）。

## 状态与渲染

当前 `apps/website` 是轻量模板（counter / main）。引入框架（React / Vue / Solid 等）时，在本节登记：

- 框架与版本
- 状态管理方案
- 路由方案
- 样式方案（当前 `style.css` 原生 CSS）

## 性能

- 首屏资源控制
- 按需加载重依赖
- 关键路径不加阻塞脚本

## 与 packages 的关系

apps 只依赖 packages 的公共导出（dist），不直接 import packages 内部源文件路径。
