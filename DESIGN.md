---
version: alpha
name: CC98
description: 浙江大学 CC98 论坛新前端的设计语言，高保真延续原站的信息密度、页面骨架与换肤能力。
colors:
  brand: "#3399ff"
  primary: "#5198d8"
  primary-hover: "#3f82bf"
  primary-fill: "#5198d8"
  primary-fill-hover: "#3f82bf"
  primary-soft: "#5198d8"
  accent: "#e5484d"
  background: "#e6e7ec"
  surface: "#ffffff"
  surface-subtle: "#f6f8fa"
  border: "#e9e9e9"
  text: "#000000"
  text-muted: "#505050"
  text-caption: "#6b7178"
  link: "#0b5394"
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
    backgroundColor: "{colors.primary-fill}"
    textColor: "{colors.on-primary}"
  button-primary:
    backgroundColor: "{colors.primary-fill}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: 12px
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.primary-fill-hover}"
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
    rounded: "{rounded.none}"
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
---

# CC98 设计语言

本文件是 CC98 新前端的视觉事实源，给人和 agent 共用。前置的 YAML token 是规范值，正文解释这些值的来历和用法。改颜色、字号、圆角这类公共约定，先改这里，再改代码。`apps/website` 已完成原始调色板、语义 token 和尺度 token 分层，业务页面应继续从语义层取值。

## Overview

CC98 是浙江大学的校园论坛，用户是熟悉它十几年的师生。界面克制、信息密度偏高，读帖和发帖是主线，视觉不抢内容。

标识蓝取老论坛沿用已久的板块色 `rgb(51,153,255)`（`brand`，即 #3399ff，见 `Forum/Styles/Site.scss` 的 `$color-board`）。夏季皮肤主色 `primary` 使用原站的 #5198d8，栏目色条、首页统计和顶栏都跟随皮肤主色。正文链接沿用原站的深蓝 #0b5394，访问前后保持同色，悬停时不加下划线。页面以 #e6e7ec 为底，白色面板承载内容。

换肤是 CC98 的传统能力。老论坛通过主色、次色、顶栏色、页面底色、正文底色和两张背景图区分皮肤，信息架构和交互不动。新前端把显示模式、皮肤、整体风格拆成三个正交维度：显示模式和皮肤已经落地，整体风格（`solid` / `elegant` / `fluent`）目前只实现 `solid`。业务组件只消费语义 token，不认具体皮肤名字。

旧站 0 至 29 共 30 个主题编号归约成 21 个 `skin`。中秋、小雪、春节、秋色之空、冬日暖雪、春樱日和、重阳、金舞迎春和新岁花朝保留亮暗配对，显示模式决定写回哪个旧编号。其余皮肤只有一个旧编号，切换显示模式不会改变服务端编号。`default` 表示跟随站点默认，当前解析为夏季。

皮肤横幅统一放在 `apps/website/src/assets/themes/{skin}/banner.jpg` 和 `banner-card.jpg`，由 Vite 纳入构建依赖图。春节、冬日暖雪和新岁花朝的亮暗图片不同，暗色资源使用 `banner-dark.jpg` 和 `banner-card-dark.jpg`。颜色变量集中在 `apps/website/src/styles/skins.css`，事实源是旧站 `Forum/Themes/*.scss`，图片事实源是旧站构建产物。新增或调整皮肤时必须同时核对旧编号、颜色变量、横幅和主题中心预览，不能只改其中一层。

## Colors

调色板围绕一个标识蓝、一个中性面板体系和少量状态色。

- **Brand（#3399ff）**：来自老论坛板块色的蔚蓝，做身份标识。用在 Logo、皮肤标识和装饰，不铺在白字文本下（白字在它上面对比只有 2.9:1）。
- **Primary（#5198d8）**：当前线上默认夏季皮肤的主色，用于标题、链接、图标和皮肤身份。`primary-fill` 是承载文字的填充色，供按钮、选中状态和实色面板使用；`primary-soft` 用于栏目色条和装饰边框。浅色模式下三者可以相同，暗色模式下分别调整亮度和饱和度。
- **Accent（#e5484d）**：警示红。未读红点、删除、错误徽标这类强提示用，一屏只出现在最需要拉注意力的地方。作纯色块加白字时属大字/UI 元素，按 3:1 判定。
- **Background（#e6e7ec）**：当前夏季皮肤的页面底色，与原站保持一致。
- **Surface（#ffffff）**：卡片、主题项、楼层、弹窗的承载面。`surface-subtle`（#f6f8fa）用于卡片内的次级分区和代码块底。
- **Border（#e3e7ec）**：分隔线和卡片描边，只做结构提示。
- **文字三级**：`text`（#1a1d21）正文与标题；`text-muted`（#5c6570）承载作者、时间、楼层、计数这类元信息，在白底和灰底都过 AA；`text-caption`（#8a929c）只用于可有可无的装饰性文字，不放需要被读到的信息。
- **Link（#0b5394）**：沿用老论坛的链接颜色，访问前后保持同色，悬停时不加下划线。
- **状态色**：`success` 绿、`warning` 橙、`error` 红，用于反馈。作图标、描边、色块用（3:1 足够）；需要当正文读的错误提示，配 `text` 或加深变体，不靠状态色本身承载 4.5:1。

深色模式各语义色单独定义，不做机械反色。页面、内容面板和浮层使用逐级变亮的深灰表面，主要层级靠表面明度和中性边框表达。皮肤色保留在标题、链接、焦点和少量装饰上，不用高亮皮肤色包围大面积内容。

暗色顶栏使用带皮肤色调的深色表面，避免直接铺满亮色主色。亮色横幅需要增加暗色遮罩或提供独立资源，压低雪地、灯光和白底插画在深色页面上的发光感。带旧站暗色编号的皮肤可以保留色相、横幅和编号关系，但正文面板仍需符合统一的暗色表面层级。

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

间距走 4px 基准的比例尺（`xs` 4 到 `3xl` 48），列表项、卡片内边距、区块间隔都从这套尺度取值。首页使用最大 90rem 的响应式栏目网格：热门话题在宽屏分两列，其他栏目按可用宽度自动排列。论坛统计收起为页面右侧的悬浮入口，鼠标悬停或键盘聚焦时展开统计面板。

页面骨架是顶栏、居中内容、页脚三段。首页顶部有 192px 横幅承载皮肤背景图，48px 顶栏叠在横幅上；内页只保留 48px 主色顶栏。顶栏底色跟随皮肤主色，不使用固定蓝。

## Elevation & Depth

层次靠色调分层和描边，不靠重阴影。页面底 `background` 比卡片 `surface` 暗一档，卡片自然浮起，卡片描边用 `border` 收边界。

只有真正脱离文档流的浮层才用阴影：下拉菜单、弹窗、悬浮卡片用柔和、扩散小的阴影，暗示临时性。正文区和主题列表不铺阴影，保持平整。

## Shapes

老论坛的圆角没有统一体系，`Forum/Styles/Site.scss` 里 4px、5px、8px、10px、16px 混用。高保真页面先保留原站的形状：首页栏目、版面分区和主题列表使用直角或 4px 小圆角；按钮和输入框使用 4px；弹窗可以使用 8px；标签、头像和圆点使用 `full`。同一页面不混用直角面板和 12px 大圆角卡片。

`solid` 是首发的 CC98 高保真风格，使用紧凑排版、直角面板和皮肤色条。后续 `elegant` 方向可以增加圆角和留白，`fluent` 方向可以使用半透明模糊表面。三者属于同层的整体风格方向，本阶段只实现 `solid`。

## Components

组件只消费语义 token，不写死颜色和尺寸。基础组件基于 Reka UI 无头能力二次封装，放在 `components/ui`。

- **Topbar**：浅色模式跟随皮肤顶栏色，暗色模式使用深色表面并带少量皮肤色调。顶栏文字和搜索控件需要在横幅各区域保持可读。
- **Button**：`primary-fill` 底配 `on-primary` 文字做主操作，一屏一个；`secondary` 面板底配 `primary` 文字和描边做次操作；`ghost` 无底色、`text` 色做低强度操作（分页、图标按钮）。悬停、按下、禁用、加载都要有明确状态。
- **Input / Textarea**：白底、`border` 描边，聚焦时描边转 `primary`，错误态转 `error` 描边并配辅助文字。
- **Card**：内容承载面。首页栏目、版面列表和主题列表优先使用直角白底面板、细描边或顶部色条；用户工具卡和弹窗可以使用小圆角。
- **Badge**：计数和状态标记，`full` 圆角。红色 `accent` 只给未读和警示，普通计数用中性色。
- **Dialog / AlertDialog**：白底浮层，`lg` 圆角，配柔和阴影和遮罩。
- **Tabs**：选中项用 `primary`，未选中用 `text-muted`。

## Do's and Don'ts

- 主操作按钮一屏只用一个 `primary`，其余降级到 secondary 或 ghost。
- 用 `brand` 做 Logo 和标识装饰，别拿它铺在白字文本下，对比不够。
- 顶栏和按钮的文字与填充色守 4.5:1；皮肤主色不直接承担填充职责，改用 `primary-fill` 和对应的 `on-primary`。
- 暗色页面用表面明度和中性边框表达层级，别用高亮皮肤色包围每张卡片。
- 亮色横幅进入暗色模式时加遮罩或替换资源，别让大面积白色和灯光紧贴深色正文。
- 红色 `accent` 只留给未读和警示，别当普通强调色铺开。
- 时间、楼层、计数这类要被读到的元信息用 `text-muted`，别用更浅的 `text-caption`。
- 状态色作正文提示时配 `text` 或加深变体，别指望状态色本身达到 4.5:1。
- 正文和主题列表不铺阴影，层次靠色调、细描边和栏目顶部色条。
- 换皮肤只换颜色、背景图和亮暗配对，不改信息架构和交互。
- 业务组件只用语义 token，不判断具体皮肤名字，不写死十六进制颜色。
- 一屏不超过两种字重，中英文混排共用同一字号基线。
