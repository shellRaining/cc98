# UI/UX 设计系统

## 当前方案

- 无头组件：Reka UI（不带 shadcn-vue，样式自写）
- 原子 CSS：UnoCSS（preset-uno + preset-attributify + preset-typography）
- 设计 token：CSS 变量驱动，定义在 `apps/website/src/styles/global.css`
- UnoCSS theme 把语义 class 映射到 CSS 变量（`apps/website/uno.config.ts`）

## 设计 token

色板（CSS 变量，light/dark 双套）：

- `--cc98-color-primary` 主色（链接、主按钮）
- `--cc98-color-accent` 强调色（hover、危险操作）
- `--cc98-color-text` 正文
- `--cc98-color-text-muted` 次要文本
- `--cc98-color-bg` 页面背景
- `--cc98-color-bg-elevated` 卡片/头部/底部背景
- `--cc98-color-border` 分隔线、边框

UnoCSS 映射：`text-cc98-primary` → `var(--cc98-color-primary)`，以此类推。组件里用语义 class，不硬编码颜色值。

## 间距与字体

UnoCSS preset-uno 默认（4px 基准，`p-2` = 8px）。字体走系统栈（`system-ui, -apple-system, "PingFang SC", "Microsoft YaHei"`），不引入外部字体。

## 组件清单

登记在用 / 计划引入的 Reka UI 组件：

- 已用：无（骨架阶段）
- 计划：Dialog（登录/弹窗）、Popover（用户卡片）、DropdownMenu（操作菜单）、Tabs（用户中心）、Toast（消息提示）、Tooltip、Combobox（搜索）、Select（版面筛选）

样式约定：Reka UI 暴露 `data-state`、`data-disabled` 等 attribute，用 UnoCSS attributify 写选择器（`data-[state=open]:animate-fade-in`）。

## 暗色与节日主题

- 切换机制：改 `<html>` 的 `data-theme`（light/dark）和 `data-theme-season`（default/spring/summer/autumn/winter 等）属性
- 实现位置：`stores/theme.ts`（Pinia store，持久化用户选择）
- 29 套节日主题（来自原项目 Themes/）后续映射成 CSS 变量覆盖，运行时切换只改 HTML 属性

## 可访问性

- 对比度满足 WCAG AA
- 键盘可达（Reka UI 默认满足）
- 语义化 HTML（header / main / nav / footer）
- 图片有 alt，图标有 aria-label
