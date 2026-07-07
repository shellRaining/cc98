# UI/UX 设计系统

## 当前状态

`apps/website` 使用原生 CSS（`style.css`），无设计系统。

## 引入设计系统时登记

- 色板（语义色：primary / success / warning / danger + 中性灰阶）
- 间距标尺（4px / 8px 基准）
- 字体阶（display / heading / body / caption）
- 圆角、阴影、动效曲线
- 组件清单与变体

## 可访问性

- 对比度满足 WCAG AA
- 键盘可达
- 语义化 HTML（button / nav / main 等）

## 暗色模式

引入时统一用 CSS 变量驱动，不在组件里硬编码颜色。
