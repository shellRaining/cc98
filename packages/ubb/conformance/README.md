# UBB 一致性语料

语言无关的行为规范测试集。TS 参考实现（本包）生成期望值，Rust、Go、C# 实现必须通过同一份 JSON。当前基线固定 `739181057294` 的行为；已知历史边界也保留，相关用例有 `note`，不由移植实现自行修正。

## 文件

- `parse-core.json`：核心解析（默认标签头语法 + 自定义 harness registry）
- `parse-cc98.json`：CC98 标签表 + CC98 参数语法解析
- `render-html.json`：CC98 预设 UBB → HTML
- `render-markdown.json`：CC98 预设 UBB → Markdown
- `manifest.json`：规范版本、参考提交、文件清单、用例数量和文件原始 UTF-8 字节的 SHA-256
- `inputs.ts`：边界输入、配置覆盖和固定种子的组合输入
- `benchmark.json`：统一基准输入，`unit.repeat(repeat)` 得到完整文本

## 结构

每个文件顶层字段：

- `schema`：`ubb-conformance/1`，结构不兼容变更时递增
- `specVersion`：规范版本。新增用例 bump minor；既有用例期望值变化 bump major
- `kind`：`parse-core` / `parse-cc98` / `render-html` / `render-markdown`
- `registry`（仅 parse-core）：harness registry 声明，各语言按声明构建
- `cases`：用例数组

用例可带 `registry`，完整替换文件级声明；可带 `mergeAdjacentText`，覆盖所选 registry 的默认值，`false` 与未提供必须区分。当前结构增加的字段向后兼容，但适配器必须执行全部字段，不能静默忽略配置。

parse 用例期望值为规范 AST JSON：

- 文本节点 `{"type":"text","value":"..."}`
- 标签节点 `{"type":"tag","tag","family","attrs":{"positionals":[],"named":{}},"raw":{"open","close"},"children":[...]}`，`family` 精确标签为 `null`，`raw.close` 无结束标签时为 `null`

render 用例 `{ name, input, expected }`，`expected` 为完整输出字符串。

## harness registry 契约

`parse-core.json` 的 `registry` 字段：

- `tags`：精确标签名 → 模式
- `families`：有序数组，`pattern` 使用锚点、ASCII 字符类和量词；数字写成 `[0-9]`，不依赖不同正则引擎的 `\d` 语义。实现方可以编译或使用等价谓词，保持顺序和精确标签优先级
- `parseTag`：`"default"`（`[tag]` / `[tag=value]`）或 `"cc98"`（旧论坛 tokenizer）
- `mergeAdjacentText`：文件级默认值，用例可用 `mergeAdjacentText` 覆盖

`parse-cc98.json` 与 render 文件不声明 registry，一律使用实现自带的 CC98 预设（静态标签表 + 六个表情标签族 + CC98 tokenizer）。

## 生成与再生成

期望值由 `generate.ts` 调用 TS 参考实现生成，禁止手改 JSON。修改行为或新增用例：

1. 在 `generate.ts` 或 `inputs.ts` 中更新输入，同时更新生成器的 `SPEC_VERSION`
2. 在本包目录运行 `vp run conformance:generate`，审查期望值的 diff；重新生成不能代替行为审查
3. 运行 `vp run conformance:check` 只读检查生成结果，再运行 `vp run ubb-core#test`
4. 把 manifest 及其列出的文件作为整体同步到各语言仓库，适配器先校验摘要、版本、kind、用例数与名称唯一性，再逐例比较结果

生成的 JSON 不参与格式化，避免改写字节后破坏摘要。离线测试只读取仓库内固定副本，不获取上游 latest。新增用例升 minor，既有期望值改变升 major，JSON 结构不兼容时另升 schema。

## 适配器和性能测量

解析比较完整 AST，允许对象键顺序不同；数组顺序、文本节点边界、空数组、null、原始标签和属性必须一致。输出字符串逐字符比较，不规范化换行、空白或 Unicode。每个用例单独报告名称，失败时给出期望值与实际值。

各语言另测 registry 不可变、重复登记、配置覆盖、handler 惰性求值、上下文、根级 finalize、可空输出和并发复用。JSON 语料不尝试序列化任意闭包。

基准必须执行真实解析或转换，不缓存按输入得到的 AST/字符串。纯解析复用 registry，HTML/Markdown 测公开快捷函数；返回值必须被消费，计时排除 JSON I/O、序列化、进程启动和构建。各项预热后串行测五轮中位数，并记录运行时、构建模式、输入 UTF-8 字节数与迭代次数。

供跨语言验证的 JSONL 程序每行接受 `{ "op": "parse" | "html" | "markdown", "input": "...", "n": 0 }`。`parse` 使用 CC98 registry；`n=0` 返回 `{ "value": AST或字符串 }`，`n>0` 连续执行 n 次并返回 `{ "ns": 每次平均纳秒 }`。stdout 只输出响应，诊断写 stderr。异常返回 `{ "error": "..." }`，不能转换成成功结果。

本包的 `driver.ts` 提供 JS 参考入口。`compare.ts` 接收可执行命令的 JSON 数组，检查默认预设语料及独立种子的额外输入；`--bench` 使用统一输入测五轮。运行前先构建对应语言的 runner。比如在本包目录验证 JS 自身：

```sh
vp node conformance/compare.ts '["vp","node","conformance/driver.ts"]'
vp node conformance/compare.ts '["vp","node","conformance/driver.ts"]' --bench
```

换成各语言 runner 的命令即可使用同样检查。核心 registry 与合并选项不属于 JSONL 简化接口，由语言本地完整语料测试覆盖。
