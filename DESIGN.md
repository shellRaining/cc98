---
version: alpha
name: CC98
description: 浙江大学 CC98 论坛新前端的设计语言，延续站点的蔚蓝标识，在此之上重做排版、层级与换肤能力。
colors:
  brand: "#3399ff"
  primary: "#1668dc"
  primary-hover: "#0f56bd"
  accent: "#e5484d"
  background: "#eef1f5"
  surface: "#ffffff"
  surface-subtle: "#f6f8fa"
  border: "#e3e7ec"
  text: "#1a1d21"
  text-muted: "#5c6570"
  text-caption: "#8a929c"
  link: "#1668dc"
  link-visited: "#7a3d6b"
  success: "#2f9e6d"
  warning: "#b8770a"
  error: "#e5484d"
  on-primary: "#ffffff"
typography:
  display:
    fontFamily: system-ui
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: system-ui
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.3
  headline-md:
    fontFamily: system-ui
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.35
  title:
    fontFamily: system-ui
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.5
  body-lg:
    fontFamily: system-ui
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.7
  body-md:
    fontFamily: system-ui
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: system-ui
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: system-ui
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.4
  caption:
    fontFamily: system-ui
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
  code:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
rounded:
  none: 0px
  sm: 4px
  md: 8px
  lg: 12px
  xl: 16px
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  2xl: 32px
  3xl: 48px
  gutter: 24px
  content-width: 1140px
components:
  topbar:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: 12px
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.on-primary}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    borderColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: 12px
  button-ghost:
    backgroundColor: transparent
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: 8px
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    borderColor: "{colors.border}"
    rounded: "{rounded.md}"
    padding: 10px
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    borderColor: "{colors.border}"
    rounded: "{rounded.lg}"
    padding: 16px
  badge:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
    padding: 4px
  dialog:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: 24px
  tab-active:
    textColor: "{colors.primary}"
    typography: "{typography.label}"
  tab-inactive:
    textColor: "{colors.text-muted}"
    typography: "{typography.label}"
  link:
    textColor: "{colors.link}"
  link-visited:
    textColor: "{colors.link-visited}"
---

# CC98 设计语言

本文件是 CC98 新前端的视觉事实源，给人和 agent 共用。前置的 YAML token 是规范值，正文解释这些值的来历和用法。改颜色、字号、圆角这类公共约定，先改这里，再改代码。当前 `apps/website` 只落地了一份占位级的明暗变量，第八阶段按本文件把它替换成完整的 token 分层，届时代码里的 `#2f5fd6` 等旧值统一向这里对齐。

## Overview

CC98 是浙江大学的校园论坛，用户是熟悉它十几年的师生。界面克制、信息密度偏高，读帖和发帖是主线，视觉不抢内容。

标识蓝取老论坛沿用已久的板块色 `rgb(51,153,255)`（`brand`，即 #3399ff，见 `Forum/Styles/Site.scss` 的 `$color-board`）。它承载论坛的身份记忆，用在 Logo、皮肤标识和少量装饰位；真正可点击的主操作用更深的 `primary`（#1668dc），让白字按钮和链接在浅色背景下达到 WCAG AA。日常界面以中性灰白为底、白色卡片承载内容，蓝色只在操作和强调处出现。

换肤是 CC98 的传统能力。老论坛每套皮肤只换主色和两张背景图，信息架构和交互不动。新前端把显示模式、皮肤、整体风格拆成三个正交维度：显示模式和皮肤是本阶段就要落地的能力，整体风格（`solid` / `elegant` / `fluent`）先只做 `solid`，其余作为后续方向。业务组件只消费语义 token，不认具体皮肤名字。

## Colors

调色板围绕一个标识蓝、一个中性面板体系和少量状态色。

- **Brand（#3399ff）**：来自老论坛板块色的蔚蓝，做身份标识。用在 Logo、皮肤标识和装饰，不铺在白字文本下（白字在它上面对比只有 2.9:1）。
- **Primary（#1668dc）**：可操作蓝。主按钮底色、链接、选中态都用它，白字和链接在浅色背景上满足 AA，悬停加深到 `primary-hover`。
- **Accent（#e5484d）**：警示红。未读红点、删除、错误徽标这类强提示用，一屏只出现在最需要拉注意力的地方。作纯色块加白字时属大字/UI 元素，按 3:1 判定。
- **Background（#eef1f5）**：页面底色，偏冷的浅灰，比白色卡片暗一档，让卡片浮起来。
- **Surface（#ffffff）**：卡片、主题项、楼层、弹窗的承载面。`surface-subtle`（#f6f8fa）用于卡片内的次级分区和代码块底。
- **Border（#e3e7ec）**：分隔线和卡片描边，只做结构提示。
- **文字三级**：`text`（#1a1d21）正文与标题；`text-muted`（#5c6570）承载作者、时间、楼层、计数这类元信息，在白底和灰底都过 AA；`text-caption`（#8a929c）只用于可有可无的装饰性文字，不放需要被读到的信息。
- **Link（#1668dc）/ Link-visited（#7a3d6b）**：延续老论坛已读链接换色的习惯，老论坛用的是深蓝 #0b5394 配深紫红 #741b47。
- **状态色**：`success` 绿、`warning` 橙、`error` 红，用于反馈。作图标、描边、色块用（3:1 足够）；需要当正文读的错误提示，配 `text` 或加深变体，不靠状态色本身承载 4.5:1。

深色模式各语义色单独定义，不做机械反色。`brand` 和 `primary` 提亮到深底上仍可读的蓝，`background` 落到接近纯黑的深灰（#111418 一带），`surface` 比背景亮一档拉层次，正文用柔和浅灰而非纯白。具体取值由主题 token 层维护，语义名保持不变。

## Typography

正文用系统字体栈（system-ui / PingFang SC / Microsoft YaHei），不引 web font，避免长列表页的字体闪烁和加载开销。老论坛正文用微软雅黑、14px，元信息 12px，本表沿用这个基线。等宽场景用 `code` 栈。

- **Display / Headline**：主题标题、版面名、页面主标题，字重 600 到 700，字号随层级递减。
- **Title**：卡片标题、主题列表项标题，16px 半粗，兼顾扫读和密度。
- **Body**：`body-lg`（16px）用于帖子正文，行高 1.7 便于长文阅读；`body-md`（14px）是列表、表单、次级内容的默认；`body-sm` 用于紧凑处。
- **Label**：按钮、标签、导航项，13px 中等字重。
- **Caption**：装饰性小字，12px 最弱一级，不承载关键信息。时间、楼层、计数这类要被读到的元信息用 `text-muted`。

一屏尽量不超过两种字重。中英文混排时英文和数字继承同一字号，不单独放大。

## Layout

桌面端用固定最大宽度的居中栏，内容区宽 `content-width`（1140px），沿用老论坛的版心（`Forum` 的 `min-width: 1140px` / `71.25rem`），两侧留白。当前代码用的 `max-w-6xl`（1152px）迁移时统一到 1140px。移动端适配不在本轮范围。

间距走 4px 基准的比例尺（`xs` 4 到 `3xl` 48），列表项、卡片内边距、区块间隔都从这套尺度取值，不写零散魔法数字。卡片内容用 `lg`（16px）内边距，栏目之间用 `gutter`（24px）。

页面骨架是顶栏、居中内容、页脚三段。老论坛首页顶部有 12rem 的横幅承载皮肤背景图，内页只留 3rem 的细顶栏、不带横幅图。顶栏底色跟随皮肤主色（老论坛的 `$theme_color_main`），不是固定蓝。

## Elevation & Depth

层次靠色调分层和描边，不靠重阴影。页面底 `background` 比卡片 `surface` 暗一档，卡片自然浮起，卡片描边用 `border` 收边界。

只有真正脱离文档流的浮层才用阴影：下拉菜单、弹窗、悬浮卡片用柔和、扩散小的阴影，暗示临时性。正文区和主题列表不铺阴影，保持平整。

## Shapes

老论坛的圆角没有统一体系，`Forum/Styles/Site.scss` 里 4px、5px、8px、10px、16px 混用。新前端主动收敛成一套比例尺：交互元素（按钮、输入框）用 `md`（8px），卡片、弹窗用 `lg`（12px），标签、头像、圆点用 `full`，需要更硬朗时用 `sm`（4px）。同一视图内不混用尖角和大圆角，保持一致的形状语气。

`solid` 首发风格用上面这套中等圆角；后续 `elegant` 方向偏大圆角和更多留白，`fluent` 方向在圆角相近的基础上叠加半透明模糊表面。三者是同层的整体风格方向，不预设材质组合，本阶段只落地 `solid`。

## Components

组件只消费语义 token，不写死颜色和尺寸。基础组件基于 Reka UI 无头能力二次封装，放在 `components/ui`。

- **Topbar**：顶栏用 `primary` 底配白字（运行时随皮肤主色变），白字在 `primary` 上过 AA。换皮肤时皮肤主色要自行保证白字对比，见 Do/Don't。
- **Button**：`primary` 蓝底白字做主操作，一屏一个；`secondary` 白底蓝字带 `primary` 描边做次操作；`ghost` 无底色、`text` 色做低强度操作（分页、图标按钮）。悬停、按下、禁用、加载都要有明确状态。
- **Input / Textarea**：白底、`border` 描边，聚焦时描边转 `primary`，错误态转 `error` 描边并配辅助文字。
- **Card**：内容承载面，白底、`lg` 圆角、`border` 描边，用于主题列表项、版面卡、用户卡。
- **Badge**：计数和状态标记，`full` 圆角。红色 `accent` 只给未读和警示，普通计数用中性色。
- **Dialog / AlertDialog**：白底浮层，`lg` 圆角，配柔和阴影和遮罩。
- **Tabs**：选中项用 `primary`，未选中用 `text-muted`。

## Do's and Don'ts

- 主操作按钮一屏只用一个 `primary`，其余降级到 secondary 或 ghost。
- 用 `brand` 做 Logo 和标识装饰，别拿它铺在白字文本下，对比不够。
- 顶栏和按钮的白字底色守 3:1 以上；换皮肤时皮肤主色要自行满足白字对比。
- 红色 `accent` 只留给未读和警示，别当普通强调色铺开。
- 时间、楼层、计数这类要被读到的元信息用 `text-muted`，别用更浅的 `text-caption`。
- 状态色作正文提示时配 `text` 或加深变体，别指望状态色本身达到 4.5:1。
- 正文和主题列表不铺阴影，层次靠色调分层和描边。
- 换皮肤只换颜色、背景图和亮暗配对，不改信息架构和交互。
- 业务组件只用语义 token，不判断具体皮肤名字，不写死十六进制颜色。
- 一屏不超过两种字重，中英文混排共用同一字号基线。
