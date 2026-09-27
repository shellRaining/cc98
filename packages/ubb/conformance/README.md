# UBB 一致性语料

语言无关的行为规范测试集。TS 参考实现（本包）是规范源，Rust、Go、C# 等移植实现必须让同一份 JSON 全部通过。任何行为变更先改这里的期望值（bump `specVersion`），再同步各实现。

## 文件

- `parse-core.json`：核心解析（默认标签头语法 + 自定义 harness registry）
- `parse-cc98.json`：CC98 标签表 + CC98 参数语法解析
- `render-html.json`：CC98 预设 UBB → HTML
- `render-markdown.json`：CC98 预设 UBB → Markdown

## 结构

每个文件顶层字段：

- `schema`：`ubb-conformance/1`，结构不兼容变更时递增
- `specVersion`：规范版本。新增用例 bump minor；既有用例期望值变化 bump major
- `kind`：`parse-core` / `parse-cc98` / `render-html` / `render-markdown`
- `registry`（仅 parse-core）：harness registry 声明，各语言按声明构建
- `cases`：用例数组

parse 用例期望值为规范 AST JSON：

- 文本节点 `{"type":"text","value":"..."}`
- 标签节点 `{"type":"tag","tag","family","attrs":{"positionals":[],"named":{}},"raw":{"open","close"},"children":[...]}`，`family` 精确标签为 `null`，`raw.close` 无结束标签时为 `null`

render 用例 `{ name, input, expected }`，`expected` 为完整输出字符串。

## harness registry 契约

`parse-core.json` 的 `registry` 字段：

- `tags`：精确标签名 → 模式
- `families`：有序数组，`pattern` 为正则字符串（仅使用各语言正则引擎通用的简单语法），实现方用本语言能力编译或改写为等价谓词
- `parseTag`：`"default"`（`[tag]` / `[tag=value]`）或 `"cc98"`（旧论坛 tokenizer）
- `mergeAdjacentText`：文件级默认值，用例可用 `mergeAdjacentText` 覆盖

`parse-cc98.json` 与 render 文件不声明 registry，一律使用实现自带的 CC98 预设（静态标签表 + 六个表情标签族 + CC98 tokenizer）。

## 生成与再生成

期望值由 `generate.ts` 调用 TS 参考实现生成，禁止手改 JSON。修改行为或新增用例：

1. 在 `generate.ts` 的用例清单中修改或添加条目
2. 在本包目录运行 `vp node conformance/generate.ts` 重新生成
3. `vp run ubb-core#test` 确认 `conformance.test.ts` 通过
4. bump `specVersion` 并把新 JSON 同步到各语言仓库
