# UBB 迁移执行计划

## 背景

复刻老 CC98 论坛前端，第一步是把全站 UBB 格式内容迁移到新系统。老项目 `/Users/shellraining/Documents/writable-project/Forum` 的 UBB 实现集中在 `Ubb/Core.tsx`（tokenizer + segment tree + handler 注册）和 `Ubb/UbbCodeExtension.tsx`（标签注册表），handler 直接返回 ReactNode 并混有播放器、MathJax 等 UI 副作用。新项目是 Vue，不迁移 React 渲染模型。

本子包的目标：提供框架无关的 UBB 解析层（文本 → AST）和双导出器（→ HTML / → Markdown），供 `apps/website` 的 Vue 渲染层和内容迁移脚本共用。

## 技术决策

### 解析层：移植 Core.tsx tokenizer

自研解析层，移植老项目 `Forum/Ubb/Core.tsx` 的 tokenizer 和 segment 构建逻辑，输出为纯数据 AST。不引入第三方 BBCode 解析库。

曾考虑 `@bbob/parser`（MIT，纯 JS，4.3w 周下载，benchmark 174 ops/s），但经四组子 agent 深度调研后否决。CC98 的 UBB 是非标准方言，与 @bbob 实现的标准 BBCode 在多处语义不兼容：

- attrs 模型完全不同。`[url=https://x]` 被 @bbob 解析成 `{"https://x":"https://x"}`，而 CC98 语义是 `mainValue: "https://x"`。几乎所有带参数标签都要推翻重解析。
- Text 模式标签（内部不递归）远不止 code/md/noubb 三个。调研发现 img/audio/mp3/video/upload/bili/math/m 全是 Text 模式（内容是 URL 或公式原文）。用 @bbob 的 `contextFreeTags` 配置 11 个标签不是麻烦的根源，真正的问题是这些标签在 @bbob 里会被正常递归解析，配成 contextFree 后内部内容又被切成碎片（`["[","b]不递归","[","/b]"]`），要手动 join 回去。
- 正则标签名（`[ac01]`、`[ms02]`、`[a:001]`）、Empty 模式（自闭合，紧跟同名结束标签则忽略）等 CC98 特有语义，@bbob 都不支持，仍需自研。

综合看，用 @bbob 变成"先让它用错误模型解析，再逐层纠正回来"，纠正的代码量 ≈ 直接移植 Core.tsx 的代码量。移植 Core.tsx 的优势是语义 100% 可控、零依赖、线上多年验证过的 tokenizer 直接可用。

移植范围：`Core.tsx` 的 `tagMatchRegExp`（tokenizer）、`UbbTagData.parse`（参数模型）、`buildSegmentsCore`（segment tree 构建）、`tryHandleEndTag`/`forceClose`（容错）约 600 行，去掉 React 相关的类型（`ReactNode`、`UbbCodeContext`、`UbbCodeEngine` 的渲染部分），只保留解析逻辑，输出为 `UbbNode[]`。

### AST 结构：自定义判别联合

纯数据、可序列化：

```ts
type UbbNode =
  | { type: "text"; value: string }
  | { type: "tag"; tag: string; attrs: UbbAttrs; children: UbbNode[] };

type UbbAttrs = {
  // 无名位置参数，按顺序：[color=red] → ["red"]，[upload=jpg,1] → ["jpg","1"]
  positionals: string[];
  // 命名参数：[img=1,title=封面] 中 title=封面 进 named
  named: Record<string, string>;
};
```

忠实映射 Core.tsx 的 `UbbTagData` 参数模型。老代码按索引读取位置参数（`tagData.value(0)`、`value(1)`），按名称读取命名参数（`value('title')`）。新 AST 用 `positionals` 数组表达所有无名值，零信息丢失。`mainValue` 不再是独立字段——绝大多数标签只有 `positionals[0]`，需要时直接访问即可。

### 容错行为（移植自 Core.tsx）

| 场景               | 行为                           | Core.tsx 来源                       |
| ------------------ | ------------------------------ | ----------------------------------- |
| 嵌套递归 `[b][i]]` | 正常建树                       | `buildSegmentsCore` Recursive 分支  |
| 未闭合 `[b]`       | 降级为纯文字，子内容提升到父级 | `forceClose`                        |
| 孤立 `[/b]`        | 保留为普通文字                 | `tryHandleEndTag`                   |
| 未知 `[foo]`       | 保留为普通文字，不吞用户内容   | `buildSegmentsCore` 无 handler 分支 |
| Text 模式标签      | 内部不递归，直接找结束标签     | `buildSegmentsCore` Text 分支       |
| Empty 模式标签     | 自闭合；紧跟同名结束标签则忽略 | `buildSegmentsCore` Empty 分支      |

### tagMode 配置

Core.tsx 的 tagMode 由各 handler 的 `getTagMode()` 决定。移植时把已知标签的模式硬编码进解析层（解析层需要一个标签名到 tagMode 的映射表），不再依赖 handler 类：

- Recursive（默认）：b i u del english size color font align left center right cursor quote quotex url table tr td th line（line 除外，见下）
- Text（内部不递归）：code md noubb img audio mp3 video upload bili math m
- Empty（自闭合）：ac\d{2} ac\d{4} ms\d{2} em\d{2} cc98\d{2} tb\d{2} [acf]:\d{3} line needreply posteronly allowviewer

## 工作分解

### 阶段 1：解析层与 AST（地基）✅

范围：`packages/ubb/src/types.ts` + `packages/ubb/src/parse.ts` + 测试。

- 定义 `UbbNode` / `UbbAttrs` 类型（`src/types.ts`）。
- 实现 `parseUbb(src: string): UbbNode[]`：
  - 移植 Core.tsx 的 tokenizer（`tagMatchRegExp` + `buildSegmentsCore`）。
  - 移植 `UbbTagData.parse`（参数模型：positionals 数组 + named 键值对）。
  - 移植容错逻辑（`forceClose`、`tryHandleEndTag`）。
  - 用 tagMode 映射表替代 handler 的 `getTagMode()`。
  - 输出纯数据 `UbbNode[]`，去掉 React 相关类型。
- 导出 `parseUbb` 和类型。

验收：172 条单元 + 容错测试全部通过；AST 结构可序列化（`JSON.stringify` 无丢失）。实际完成 258 条测试（含边缘测试和 E2E 测试）。

### 阶段 2：Markdown 导出器 ✅

范围：`packages/ubb/src/to-markdown.ts` + 测试。

- 遍历 AST，每类 tag 一个转换函数。
- Markdown 能表达的：`[b]`→`**`、`[i]`→`_`、`[del]`→`~~`、`[url=]`→`[text](url)`、`[img]`→`![](url)`、`[quote]`→`>`、`[code]`→`` ` ``、`[line]`→`---`。
- Markdown 无法表达的：剥除样式（color/size/font/align），富媒体降级为文本或链接，站内语义标签（user/topic/board）降级为纯文本或站内链接。
- 表情 `[acNN]` 等正则标签：剥除为空字符串。

验收：51 条测试全部通过；老论坛典型帖子片段转 Markdown 后语义不丢；嵌套结构正确。

### 阶段 3：HTML 导出器 ✅

范围：`packages/ubb/src/to-html.ts` + 测试。

- 同样遍历 AST，输出净化后的 HTML 字符串。
- 安全策略：文本转义 HTML 特殊字符（& < > "）；URL 协议白名单（http/https/mailto/相对路径）；属性值转义防止注入。
- 富媒体（audio/video/bili）输出 HTML5 标签或链接。
- md 标签输出 `<div class="ubb-md">` 占位结构，由 Vue 组件层接管。

验收：50 条测试全部通过；HTML 输出经安全净化不含危险标签/属性。

### 阶段 4：Vue 渲染层（apps/website）

不在本子包范围，单独立 plan。

## TDD 流程

按 `docs/quality.md` 规定：

- 测试由子 agent 编写，主 agent 实现使之通过。
- 不得为通过测试而改测试。
- 容错场景（未闭合标签、孤立结束标签、未知标签）尚未被现有测试覆盖，阶段 1 实现时需补专门的容错测试（如 `parse-error-handling.test.ts`）。
- 每个阶段：子 agent 先写测试 → 主 agent 实现 → `vp run ready` 通过。

## 标签迁移清单

来源 `Forum/Ubb/UbbCodeExtension.tsx` 注册表，按阶段 2/3 处理优先级分组：

| 优先级    | 标签                                              | Markdown          | HTML     |
| --------- | ------------------------------------------------- | ----------------- | -------- |
| P0 高频   | b i u del size color font url img quote code line | 转换或剥除        | 转换     |
| P0 高频   | ac\d+ em\d+ ms\d+（表情）                         | 剥除或图片        | 图片     |
| P1 结构   | align left center right table tr td th            | 剥除/转 HTML 表格 | 转换     |
| P1 文本   | md noubb english cursor                           | 原文/剥除         | 转换     |
| P2 站内   | user topic board pm                               | 站内链接          | 站内链接 |
| P2 权限   | needreply posteronly allowviewer                  | 文本标注          | 条件渲染 |
| P3 富媒体 | audio video bili upload                           | 链接              | 占位组件 |
| P3 特殊   | math mahjong tb cc98                              | 原文              | 特殊渲染 |

## 非目标

- 本阶段不做 Vue 渲染组件（阶段 4）。
- 本阶段不迁移老项目 React handler。
- 本阶段不做 UBB 编辑器。
- 本阶段不做 Markdown→UBB 反向转换。

## 验收标准

- `vp run ready` 通过。
- `parseUbb` 能正确解析 spike 中全部场景。
- `toMarkdown` 覆盖 P0 标签。
- `toHtml` 覆盖 P0 标签且输出经净化。
- `packages/ubb` 公共 API 有完整类型导出。
- `ARCHITECTURE.md` 的子包描述与本实现一致。

## 提交拆分建议

1. `feat(ubb): 实现 parseUbb 与 AST 类型（移植 Core.tsx）`
2. `feat(ubb): 实现 toMarkdown 导出器（P0 标签）`
3. `feat(ubb): 实现 toHtml 导出器（P0 标签）`
4. `feat(ubb): 补充 P1/P2 标签转换`
5. （后续）`feat(website): 接入 UBB Vue 渲染层`

## 决策记录

- 2026-07-08：解析层用 @bbob/parser，不移植 Core.tsx。spike 验证容错行为可接受。
- 2026-07-08：AST 用自定义判别联合，attrs 区分 mainValue 和命名参数。
- 2026-07-08：渲染层和导出器自研，不用 @bbob preset。
- 2026-07-08：legacy-cases.ts 的 expected 按 @bbob 行为重写，保留 9 个边界场景作为回归基线。
- 2026-07-09：撤销 2026-07-08 的 @bbob/parser 决策，改为移植 Core.tsx。四组子 agent 深度调研发现 CC98 方言程度远超预期（attrs 模型不兼容、Text 模式标签多达 11 个、正则标签名/Empty 模式 @bbob 不支持），用 @bbob 的纠正成本 ≈ 直接移植成本。148 条已编写测试按 AST 结构断言，不依赖底层库，切换实现路径后测试不变。
- 2026-07-09：TextTagHandler 子类在新解析器里按 Text 模式建树（内部不递归）。老代码这些标签（code/md/noubb/img/audio/video/upload/bili/math/m）实际是 Recursive 建树、渲染层用 getContentText() 取纯文本；新项目在解析层就按 Text 模式处理，与 Markdown 语义一致——源码块/URL/LaTeX 内的方括号不应被当标签。
- 2026-07-09：AST 的 attrs 用 `{ positionals, named }`，放弃之前的 `mainValue` 抽象。positionals 数组按顺序存储所有无名参数，忠实映射 Core.tsx 的 UbbTagData 参数模型，能表达 `[upload=jpg,1]`、`[td=2,3]` 等多无名参数场景。
- 2026-07-09：删除早期测试基建阶段产出的 `legacy-parse-cases.test.ts` 和 `fixtures/legacy-cases.ts`，其容错场景将在实现阶段以真实 AST 断言形式重新补入。
- 2026-07-09：新增 autoclose 模式（第四种 TagMode）。user/topic/board/pm 在 Core.tsx 中是 Recursive，但 CC98 实际用法中 `[user=张三]` 不写结束标签。Recursive 模式下未闭合会被 forceClose 降级为文本，与实际用法矛盾。autoclose 模式：buildSegments 时走 Recursive 分支（允许包裹内容），forceClose 时未关闭则保留为空标签节点（children=[]）、子段提升到父级。这样 `[user=张三]` 自闭合、`[user]张三[/user]` 包裹均正确处理。
- 2026-07-09：`[color=]` 空属性值映射为 positionals=[""]（而非 []）。Core.tsx 的 tokenizer 对 `[b]` 和 `[color=]` 产生的 parameters[0].value 均为 null，但 tagString 中前者无等号、后者有等号。新解析器在 convertTokens 后检查：第一参数有 name（说明有等号）但 value 为 null 时，设为空字符串，从而区分 `[b]`（positionals=[]）和 `[color=]`（positionals=[""]）。
- 2026-07-09：结束标签匹配大小写不敏感。Core.tsx 的 tryHandleEndTag 和 Text 模式 indexOf 均对大小写敏感，但新项目要求标签名归一化（`[B]...[/b]` 合法）。用 toLowerCase 后 indexOf 实现。
- 2026-07-09：实现拆分为三个模块——tag-data.ts（tokenizer + 参数提取）、tags.ts（标签模式表）、parser.ts（segment 树 + 主循环 + AST 转换）。对应 Core.tsx 的 UbbTagData / UbbCodeExtension / buildSegmentsCore 三部分。阶段 1 完成，181 条测试（172 单元 + 9 E2E）全部通过。
- 2026-07-09：ubbToMarkdown 替换为 AST 版（正则 PoC 废弃）。code 单行用行内代码、多行用围栏代码块；quote 按行加 `> ` 前缀；noubb 转义方括号；line 在文本中间时前后加换行、首尾时自动清理。51 条测试全部通过。
- 2026-07-09：ubbToHtml 安全净化策略——文本转义 & < > "（顺序先 & 防二次转义）；URL 协议白名单（http/https/mailto/相对路径），危险协议替换为 #；style/colspan/rowspan 属性值转义防止注入；Text 模式标签内部内容同样转义。md 输出 `<div class="ubb-md">` 占位供 Vue 层接管。50 条测试全部通过。阶段 2/3 完成，总计 308 条测试。
