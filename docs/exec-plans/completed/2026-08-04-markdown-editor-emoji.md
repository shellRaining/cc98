# Markdown 编辑器表情输入

## 背景

`apps/website` 的 Markdown 编辑器是 `components/MarkdownEditor.vue`，基于 Milkdown Crepe 7.21.3 封装，发帖、回帖、编辑三处共用。当前工具栏只有 Crepe 内置的 topBar 按钮（标题选择 + 加粗/斜体/删除线/列表/链接/表格/代码块/公式/引用/分隔线）和选中文本时的浮动工具栏，没有表情入口；编辑器下方只有"上传图片 / 上传附件"两个按钮。

论坛表情的资源与 Markdown 形态已有事实源：

- `packages/ubb/src/emotion.ts` 的 `resolveUbbEmotionTag` 定义了六类表情（em / ac / ms / cc98 / tb / mahjong）的编号合法范围与图片 URL 规则，资源根为 `https://www.cc98.org/static/images`。
- `packages/ubb/src/to-markdown.ts` 已把 UBB 表情转成标准 Markdown 图片 `![AC娘 01](https://www.cc98.org/static/images/ac/01.png)`，渲染端 `components/rich-content/markdown/MarkdownRenderer.vue`（remark）直接支持该语法。

已确认 Crepe 的 topBar feature 提供官方钩子 `TopBarFeatureConfig.buildTopBar(builder: GroupBuilder<TopBarItem>)`，可以在工具栏末尾追加自定义按钮，按钮由 `icon`（内联 SVG 字符串）+ `onRun(ctx)` 定义，与现有按钮同构。

已与用户确认的方向：表情面板只放论坛图片表情；入口放在 topBar 工具栏；按钮图标从现有图标库（`@iconify-json/fa`、`@iconify-json/heroicons`）取，风格与 Crepe 内置图标相近。

## 目标

Markdown 编辑器工具栏末尾增加"表情"按钮，点击弹出分类面板（CC98 / AC娘 / 麻将脸 / 贴吧 / 雀魂 / 经典），选择表情后在光标处插入对应 Markdown 图片，插入结果与 UBB→Markdown 迁移输出一致。

## 非目标

- 不加 Unicode emoji 面板（二期再议，另行计划）。
- ~~不改 `packages/ubb` 的公共 API：表情枚举数据放 website 侧，编号规则与 `emotion.ts` 对齐并用 `resolveUbbEmotionTag` 校验。~~ 2026-08-05 撤销，表情目录改由 ubb 导出，见决策记录。
- 默认不替换 Crepe 全部内置图标，除非视觉验收发现风格不协调（见方案，预计不需要）。
- 不涉及 UBB 内容编辑（本项目没有 UBB 编辑器）。

## 方案

### 图标

用 `heroicons:face-smile-solid`（`@iconify-json/heroicons` 已在 devDependencies）：24×24 viewBox、`fill="currentColor"` 的实心几何风格，与 Crepe 内置图标（24×24 fill path，Material 风格）一致，不需要替换其他内置图标。

Crepe 的 `Icon` 组件通过 `innerHTML` 注入内联 SVG 字符串（DOMPurify 过滤），不接受 iconify 类名。因此把该图标的 SVG path 提取为字符串常量（代码注释标注来源 `heroicons:face-smile-solid`），通过 `buildTopBar` 的 `icon` 字段传入。

### 表情按钮与面板

`MarkdownEditor.vue` 的 `topBar` feature 配置增加 `buildTopBar`：

- `builder.addGroup("emoji", "表情").addItem("emoji", { icon: 笑脸SVG, active: () => false, onRun: (ctx) => 打开面板 })`。
- `onRun` 保存 `ctx` 供面板插入时使用，并把 `emojiPanelOpen` 置为 `true`。

新增 `components/markdown-editor/EmojiPanel.vue`：分类 tab + 表情网格，浮层渲染在 `markdown-editor__shell` 内（topBar 下方），点击外部关闭；样式用 DESIGN.md 的 token（`--cc98-color-*`）+ UnoCSS；编辑器 `disabled` 时不渲染。

新增 `components/markdown-editor/emoji-data.ts`：只放面板的 UI 配置（分类 tab 顺序、tab 文案、格子边长）与笑脸图标 SVG 常量，表情条目由 `packages/ubb` 的 `listUbbEmotions(family)` 提供，展示名由 `ubbEmotionDisplayName` 提供（`CC98 01`、`AC娘 01`、`麻将脸 动物 001` 等），与 `to-markdown.ts` 输出同源。

### 插入

点击表情后执行 `editor.value.action((ctx) => …)`：

- `const view = ctx.get(editorViewCtx)`，先 `view.focus()`（点击 topBar 按钮和面板时编辑器可能失焦，selection 保留在 state 中）。
- 用 `schema.nodes.image.createAndFill({ src, alt })` 创建节点，`view.dispatch(view.state.tr.replaceSelectionWith(node))` 替换当前 selection（与现有 `insertImageCommand` 语义一致），输出 Markdown 即 `![alt](src)`。

`modelValue` 的同步不需要额外处理：Milkdown 的 `markdownUpdated` 监听已存在，插入会自然触发 `update:modelValue`。

### 表情枚举范围（`packages/ubb/src/emotion.ts` 的 `FAMILY_SPECS`）

- em：`em00`–`em91`（`em\d{2}`，数值 ≤ 91）。
- ac：`ac01`–`ac54`、`ac1001`–`ac1040`、`ac2001`–`ac2055`。
- ms：`ms01`–`ms54`。
- cc98：`cc9801`–`cc9837`（15–30、36–37 用 png，其余 gif）。
- tb：`tb01`–`tb33`。
- mahjong：animal `a:001`–`a:016`；cartoon 共 10 个（003/018/019/046/049/059/096/134/189/217，其中 018/049/096 为 gif）；face `f:001`–`f:208`（13 个 gif 编号 004/009/056/061/062/087/115/120/137/168/169/175/206）。

## 实施步骤

1. 新增 `components/markdown-editor/emoji-data.ts`：表情枚举生成 + `resolveUbbEmotionTag` 校验 + 笑脸图标 SVG 常量。✅
2. 新增 `components/markdown-editor/EmojiPanel.vue`：面板 UI 与交互。✅
3. 修改 `components/MarkdownEditor.vue`：`buildTopBar` 追加按钮、面板挂载与状态、`insertEmoji` 插入函数、按钮 aria-label（沿用 `labelCrepeControls` 模式）。✅
4. 新增单测：枚举与 `resolveUbbEmotionTag`/`to-markdown` 输出一致；插入函数的 markdown 输出。✅
5. 验证：`vp check`、`vp run -r test`、agent-browser 走查面板与插入。✅
6. 2026-08-05 简化重构：表情目录收归 `packages/ubb`，面板与测试按单一事实源收敛。✅

## 验证

- `vp run ready` 全绿：format + lint + typecheck + `check:colors` + `knip --include files,exports,types` + `vp run -r build` + `vp run -r test`（website 296、ubb 190、api 21 用例）。
- 浏览器走查（临时挂载页 + agent-browser，走查后删除挂载页）：表情按钮弹出面板，8 个分类 tab 与 CC98 37 格图片正常加载；点击 CC98 01 插入 `![CC98 01](https://www.cc98.org/static/images/CC98/CC9801.gif)` 并自动关闭面板；按钮二次点击关闭、点击面板外关闭；暗色模式下 AC 娘格子与插入结果均为 `/ac-dark/01.png`。
- 待用户在真实页面确认的剩余项：发帖页、回帖页、编辑页三处入口的实际观感，以及只读态无表情按钮。

## 进展与调整

- 2026-08-04：计划评审通过后开始实施，代码与单测完成。
- 实现中根据 review 结论把"面板外部点击关闭"的监听从面板组件移到 `MarkdownEditor.vue`，用同步标记区分按钮触发与外部点击，避免依赖 Vue 响应式更新时序的隐式前提。
- `vp install` 曾自动升级 catalog 依赖（milkdown 7.21.3→7.22.0 等），与本次任务无关，已还原 `package.json` 与 `pnpm-workspace.yaml`，环境保持 7.21.3 与 lock 一致。
- 2026-08-04 用户走查后反馈三个美观问题，已修复并用 agent-browser 实测验证：
  1. 亮色模式激活 tab 文字与背景同色（`--cc98-blue-soft` 在亮色下等于 `--cc98-blue-strong`），文字被遮住。改为 `background: primary-soft` + `color: on-primary`（与 SigninView 的标签用法一致），亮暗模式均为白字蓝底。
  2. 暗色模式下 AC 娘应使用暗色资源。面板渲染时按 `useThemeStore().effectiveMode` 把 `/ac/` 替换为 `/ac-dark/`，与 UBB 渲染端 `UbbEmotion.vue` 的规则一致；实测暗色下缩略图与预览窗均加载 `ac-dark` 资源。
  3. 表情网格过密、图太小。格子放大到 2.75rem、间距 0.375rem；点击缩略图弹出方形放大预览窗（约 144px，显示图与名称），点击预览窗插入正文。
- 2026-08-04 第二轮走查反馈后再次调整（均已实测）：
  1. hover 激活 tab 时 `:hover` 特异性高于 `--active`，白字被浅灰底覆盖。补 `.emoji-panel__tab--active:hover` 保持蓝底白字，非激活 tab hover 文字加深为 `text`。
  2. 去掉两步预览窗，恢复点击表情直接插入正文。
  3. 候选区按原 UBB 编辑器习惯分尺寸：AC 娘 76×66px（原项目 75×65）、麻将脸 2.5rem、其余分类 3rem。
- 2026-08-04 第三轮走查反馈后调整（均已实测）：
  1. CC98、雀魂格子加大到 4rem（图片实际 130×130 / 150×150），贴吧保持 3rem（图片实际仅 30×30），经典 em 3rem（72×72）。
  2. 面板不再铺满编辑器宽度，改为右上角表情按钮下方弹出的小框（宽 22rem、右对齐），带 160ms 淡入 + 上移 + 缩放动画（CSS animation，`transform-origin: top right`）。不用 Vue `<Transition>` 组件（oxfmt 解析该模板结构失败，改用 CSS animation 达到同样弹出效果）。
- 2026-08-04 插入策略按用户确认调整为所见即所得：编辑器插入面板当前显示版本（暗色模式插入 ac-dark、亮色插入 ac），渲染端改为双向适配（暗色 `ac→ac-dark`、亮色 `ac-dark→ac`），任何主题下显示正确；提取公共函数 `resolveEmotionDisplaySrc` 供面板与编辑器共用。
- 遗留：~~插入正文的表情 src 为白天版（与 UBB→Markdown 迁移输出一致）；Markdown 渲染端（`MarkdownRenderer.vue`）暂无 UBB 渲染那样的 ac-dark 主题替换，暗色模式下已发布的 Markdown 帖中 AC 娘仍显示白天版，属渲染端一致性问题，待确认是否纳入二期。~~ 已随所见即所得方案一并处理（插入随主题 + 渲染端双向适配），不再遗留。
- 2026-08-05 用户 review 后做简化重构（`vp run ready` 全绿，浏览器实测通过，净 −214 行）：
  1. 表情合法编号区间此前在 ubb 与面板各存一份，面板还把拼出的 tag 反解一遍来自检。现在区间集中到 `emotion.ts` 的 `FAMILY_SPECS`，导出 `listUbbEmotions`、`UBB_EMOTION_FAMILIES`、`ubbEmotionDisplayName`；`to-markdown.ts` 删掉 `emotionMarkdownAlt` switch 改调同一函数，展示名单一来源。
  2. `emoji-data.ts` 从 124 行降到 36 行，只剩 UI 配置与图标常量。
  3. 麻将脸的 `mahjongSubgroups` 派生结构删除，animal / cartoon / face 直接作为三个 tab，面板只剩一条渲染路径。
  4. 手写的 pointerdown 闩锁（模块级标记 + `useEventListener(window, …)`）换成 VueUse 的 `onClickOutside(…, { ignore: [".milkdown-top-bar"] })`，按钮开关与外部关闭均实测正常。
  5. 测试收敛为两个契约：面板分类列表与 ubb 权威列表一致（ubb 新增分类即失败）、AC 娘明暗资源解析；新增 `packages/ubb/tests/emotion.test.ts` 守 `listUbbEmotions` 与 `resolveUbbEmotionTag` 的一致性。

## 决策记录

- 图标用 `heroicons:face-smile-solid` 提取的 SVG 常量，默认不替换 Crepe 内置图标。若走查发现风格不协调，替换全部内置图标作为后续选项。
- 2026-08-05 推翻"表情数据放 website 侧"：表情编号区间是 ubb 解析器的固有知识，前端再抄一份就有两个事实源，且要靠反解自检来维持一致。改为 ubb 导出 `listUbbEmotions` / `ubbEmotionDisplayName`，website 只描述 UI 呈现。ubb 仍不含 UI 状态，只是从"只读解析"扩展为"表情目录 + 解析"。
- 用 image 节点插入而非字符串拼接：与 Crepe 现有图片插入语义一致，避免手写 Markdown 与节点解析的差异。
