# 0002. UBB 解析器不引入 Wasm

Date: 2026-07-09
Status: Accepted

## 背景

`packages/ubb` 的解析器已经修掉了主要的 O(n²) 问题和递归栈溢出问题。原 benchmark 把约 12.2MB 的样本误写成 6.2MB，并根据两个规模的手测结果判断为线性增长。现有数据只能说明常规大输入的耗时仍可接受，不足以单独证明算法复杂度。

这里仍然有一个看起来很诱人的想法：既然 UBB 解析主要是字符串扫描和 AST 构造，能不能把这部分写成 Rust，再编译成 Wasm，让 JavaScript 只负责调用结果？

这个想法值得测一次，但不能直接从“Rust 更快”推出“Wasm 版本更快”。浏览器和 Node 里的 Wasm 有自己的运行边界。JavaScript 字符串传进 Wasm 要经过绑定层；Rust 里的 AST 要回到 JavaScript，也需要序列化、反序列化，或者逐个创建 JS 对象。UBB 解析的输出不是一个数字，而是一棵节点很多的对象树，这正是边界成本容易放大的地方。

因此这次 spike 的目标不是证明 Wasm 快，也不是证明 Wasm 慢，而是把几条路径拆开测清楚。

## 实验

实验代码是一次性 Rust + wasm-bindgen spike，不接入正式 workspace，也不改 `@cc98/ubb` 的公共 API。实验源码不随本 ADR 进入主线，本文只保留环境、接口、样本和结果，足够支撑后续判断。要复测时，可以按这里记录的导出函数重新搭一个临时 spike。

环境：

- macOS / Darwin arm64
- Node.js v24.9.0
- Rust 1.92.0
- wasm-bindgen 0.2.126
- Node 可加载 Wasm 约 100KB
- Wasm require/load 约 3.90ms

Rust 侧实现了五个导出函数：

| API                           | 目的                                                              |
| ----------------------------- | ----------------------------------------------------------------- |
| `scan_count(input)`           | 只扫描可识别 UBB 标签数量，用来观察字符串进入 Wasm 后的纯扫描成本 |
| `ubb_to_json_ast(input)`      | Rust 解析后返回 JSON 字符串                                       |
| `ubb_to_js_ast_serde(input)`  | 通过 `serde_wasm_bindgen` 直接返回 JS `Array/Object`              |
| `ubb_to_js_ast_manual(input)` | 手写 `js_sys::Array/Object` 构造 JS AST                           |
| `ubb_to_html(input)`          | Rust 侧直接输出 HTML 字符串                                       |

对应的 TypeScript baseline：

- `jsScanCount(input)`，只用 JavaScript 扫描标签数量
- `parseUbb(input)`，当前正式解析器
- `ubbToHtml(input)`，当前正式 HTML 导出器

样本覆盖六类输入：

- 1.2KB 短帖子
- 12.2KB 中等帖子
- 122.2KB 长帖子
- 1.2MB 超长帖子
- 12MB 极端帖子
- 81.6KB 病态样本，包含大量未闭合 `[code]`、深嵌套和孤立结束标签

正确性先做了抽查。benchmark probe 中，JSON AST、serde JsValue AST、manual JsValue AST、scan count 均与 TypeScript 输出一致。额外抽查了基础样式、错配闭合、Text 模式、autoclose、命名参数、Empty 标签，AST 和 HTML 都与 TypeScript 输出一致。

## 结果

单位是平均耗时。`Wasm JSON + parse`、`Wasm JsValue serde`、`Wasm JsValue manual` 都是返回 JS AST 的候选路径。`Wasm direct HTML` 测的是避开 AST 回传，直接返回 HTML 字符串。

| 样本     |      规模 | JS scan | Wasm scan | TS parseUbb | Wasm JSON string | Wasm JSON + parse | Wasm JsValue serde | Wasm JsValue manual | TS ubbToHtml | Wasm direct HTML |
| -------- | --------: | ------: | --------: | ----------: | ---------------: | ----------------: | -----------------: | ------------------: | -----------: | ---------------: |
| 短帖子   |     1.2KB |  0.03ms |    0.02ms |      0.08ms |           0.04ms |            0.06ms |             0.08ms |              0.12ms |       0.04ms |           0.03ms |
| 中等帖子 |    12.2KB |  0.07ms |    0.09ms |      0.23ms |           0.24ms |            0.52ms |             0.83ms |              1.20ms |       0.29ms |           0.28ms |
| 长帖子   |   122.2KB |  0.52ms |    0.87ms |      2.39ms |           2.45ms |            4.73ms |             5.57ms |             11.00ms |       3.77ms |           2.62ms |
| 超长帖子 |  1221.7KB |  5.08ms |    8.61ms |     28.53ms |          24.99ms |           45.37ms |            51.58ms |            117.58ms |      45.98ms |          25.85ms |
| 极端帖子 | 12216.8KB | 52.74ms |   86.67ms |    541.31ms |         255.73ms |          512.14ms |           553.47ms |           1211.31ms |     604.85ms |         266.16ms |
| 病态样本 |    81.6KB |  0.56ms |    0.85ms |     84.39ms |          69.12ms |           70.80ms |            71.78ms |             78.44ms |      85.76ms |          76.25ms |

## 分析

纯扫描没有赢。当前 Rust spike 要先把 JavaScript 字符串交给 Wasm，Rust 侧再按 UTF-8 `&str` 扫描。V8 的 `indexOf` 对这类文本很强，直接在 JavaScript 里扫反而更快。

JSON 字符串路径只赢了一半。Rust 在 Wasm 内部把 UBB 解析成 JSON 字符串，1MB 以上开始比 TypeScript `parseUbb` 快。问题出在下一步：只要 JS 端要拿到 AST，就还要 `JSON.parse`。12MB 极端样本里，Wasm 生成 JSON 字符串是 255.73ms，加上 `JSON.parse` 后变成 512.14ms，和 TS `parseUbb` 的 541.31ms 基本在同一档。

直接创建 JS 对象也没有救回来。`serde_wasm_bindgen` 可以直接返回 JS `Array/Object`，看起来省掉了 `JSON.parse`，但它仍然要递归创建大量 JS 对象和数组。12KB、122KB、1.2MB 都慢于 JSON + parse，也慢于 TS。12MB 时 `serde_wasm_bindgen` 是 553.47ms，和 TS 的 541.31ms 接近。手写 `js_sys::Object/Array` 更慢，因为每个节点都要多次 `Reflect.set`，12MB 到了 1211.31ms。

HTML 字符串路径有优势。`ubb_to_html(input)` 直接在 Rust 侧产出 HTML 字符串，跨边界只返回一个字符串，不需要把一棵 AST 搬回 JS 堆里。122KB 起就有收益，1.2MB 是 25.85ms 对 45.98ms，12MB 是 266.16ms 对 604.85ms。

病态样本里 Wasm 略快，但这不是把主线迁到 Wasm 的理由。这更像是提醒 TypeScript 解析器还有可做的局部优化，比如 EOF 收尾、未闭合标签、孤立结束标签的常数项。

## 决策

`parseUbb` 主线继续保留 TypeScript 实现，不引入 Wasm。

原因很直接：调用方需要的是 JS AST。只要输出是一棵 JavaScript 对象树，Wasm 内部解析得再快，也要付出数据回传和对象构造成本。JSON 路径要序列化和 `JSON.parse`；直接 JsValue 路径要创建大量 JS 对象；手写对象路径成本更高。对当前 `parseUbb` 来说，Wasm 没有形成稳定收益，还会引入构建、加载、调试、浏览器兼容和 CSP/MIME 等额外复杂度。

可以保留一个后续可能性：如果将来有大量只需要 HTML 字符串的场景，可以单独评估 `ubbToHtmlWasm` 作为可选 fast path。这个 fast path 不能替代 `parseUbb`，也不能在没有完整一致性测试、浏览器加载路径和包体评估前进入主线。

## 备选

**Wasm 返回 JSON 字符串**，实现简单，跨边界次数少。大输入下 Rust 生成 JSON 字符串确实快，但 JS 端最终要 `JSON.parse` 成 AST，端到端收益不稳定。

**Wasm 直接返回 JS 对象**，分别测了 `serde_wasm_bindgen` 和手写 `js_sys::Object/Array`。自动转换没有稳定超过 TS；手写对象更慢，也更难维护。

**Wasm 直接返回 HTML 字符串**，性能最好，但它改变了 API 形态，只适合 `ubbToHtml` 这种终态输出，不适合需要 AST 的 Vue 渲染层和迁移工具。

**离线迁移用 Rust CLI**，仍然可以考虑。离线批处理不需要经过 JS/Wasm 边界，Rust 可以直接读入帖子、输出 HTML 或 Markdown。这个方向和浏览器端 Wasm 是两件事。

## 后果

正面：

- `packages/ubb` 保持纯 TypeScript，构建链路简单，调试和测试都在现有工具栈内完成。
- 不把 Wasm 加进主 bundle，避免额外加载、MIME、CSP、SSR/Node ESM/CJS glue 等问题。
- 这次 spike 的关键数据直接写进 ADR，后续再有人想把 parser 搬进 Wasm，可以先看这里的环境、样本、接口和结果。

负面：

- 放弃了 Wasm 在大输入上直接生成字符串的性能优势。
- 如果未来 `ubbToHtml` 成为热点，还需要重新做浏览器端测试，而不能直接套用 Node 里的结果。

后续要做：

- 继续优化 TypeScript `parseUbb` 的病态输入路径，优先看未闭合 Text 标签、孤立结束标签和 `forceClose` 常数项。
- 实验源码不进入主线。复测时重新建一次性 spike，不把实验包接进正式 workspace。
- 如需推进 `ubbToHtmlWasm`，先写一份单独执行计划，覆盖一致性测试、浏览器加载、包体、CSP/MIME 和降级路径。
