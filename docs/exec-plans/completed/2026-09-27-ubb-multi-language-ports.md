# UBB 多语言移植：语料提取与三语言实现

## 背景

`ubb-core` 1.0.0 已发布，是框架无关的 UBB 解析与输出工具；本计划实施期间从 `@cc98/ubb` 改名。目标是把同一套行为带到 Rust、Go、C# 生态，形成 ubb-core 多语言系列。决策与总体布局见对话结论，要点：

- 各语言手写惯用实现，不做 FFI/WASM 统一核心（registry/handler 依赖闭包，跨 FFI 不自然）。
- 行为一致性靠共享一致性语料（conformance corpus）保证，语料以本仓库 TS 实现为规范源生成。
- 新仓库放在 `cc98-workspace` 下：`ubb-rs`（crate `ubb-core`）、`ubb-go`、`ubb-dotnet`（NuGet `Ubb.Core`）。GitHub 远程与 CI 配置属第二阶段。

## 目标

1. 从 TS 参考实现提取语言无关语料，覆盖解析、容错、CC98 参数语法、HTML/Markdown 输出与安全规则。
2. monorepo 内语料测试守住参考实现自身不漂移。
3. Rust、Go、C# 三个实现各自通过同一份语料测试。

## 语料设计

- 位置 `packages/ubb/conformance/`，四个 JSON：`parse-core.json`、`parse-cc98.json`、`render-html.json`、`render-markdown.json`。
- 文件头含 `schema`（ubb-conformance/1）与 `specVersion`；新增用例 bump minor，期望变化 bump major。
- parse 用例期望输出为规范 AST JSON：text 节点 `{type,value}`，tag 节点固定含 `family`（可 null）、`attrs.positionals/named`、`raw.open/close`、`children`。
- `parse-core.json` 文件级声明 harness registry（tags + 有序 families + parseTag 类型 + mergeAdjacentText 默认值），各语言测试按声明构建；family pattern 为各语言正则引擎均支持的简单形态。
- `parse-cc98.json` 与 render 文件使用各语言的 CC98 预设构建。
- `generate.ts` 持有精选输入清单并调用 TS 实现生成期望值，保证语料与实现零偏差；`conformance.test.ts` 回读 JSON 断言。

## 各语言实现要点

共同移植面：types、默认 parseTag（`[tag]`/`[tag=value]`）、CC98 tokenizer（逗号/等号/引号 + convertTokens 容错）、解析器（两阶段、容错与 autoclose 语义）、registry（不可变、族优先级）、泛型 renderer（惰性 content/textContent、renderNodes、根级 finalize）、emotion 规则、HTML/Markdown 预设（转义 + URL 白名单）。

- ubb-rs：crate `ubb-core`，builder 式 registry（move self），handler 闭包，AST serde 派生；`cc98`、`serde` 为 default feature；`cargo test` 读 `tests/data/` 语料。
- ubb-go：module 名暂用 `ubb-go`（GitHub 定址后统一调整），`Register` 族匹配用 `func(string) bool`；测试读 `testdata/`。
- ubb-dotnet：`Ubb.Core` 类库 + `Ubb.Core.Tests` xUnit，record/泛型渲染器，`System.Text.Json` 对齐语料 JSON；SDK 用 dotnet-install 装用户目录。

## 步骤

1. [x] 通读 TS 实现，确定移植面与行为清单
2. [x] 写本计划
3. [x] 语料：README、generate.ts、四个 JSON、conformance.test.ts，`vp run ubb-core#test` 通过
4. [x] ubb-rs 实现并 `cargo test` 通过
5. [x] ubb-go 实现并 `go test ./...` 通过
6. [x] ubb-dotnet 实现并 `dotnet test` 通过
7. [x] 汇总验证、更新本计划状态

## 结果

- 语料：4 个 JSON、152 个用例（parse-core 43、parse-cc98 31、render-html 38、render-markdown 40，render 两类含 mixed-post 集成用例），specVersion 1.0.0。后续扩充记录见 `2026-09-27-ubb-conformance-performance.md`。
- 解析器移植采用显式栈替代 TS 版 parent 指针（开放标签驻留栈上，关闭时挂入父级），三语言结构一致，避免深嵌套递归栈溢出并保持 forceClose 语义。
- TS 版 `??`（nullish）与 `||`（falsy）语义差异在 url/pm/user 等 handler 中逐一对齐（空字符串属性不回落到 textContent 等）。
- crate/包结构：ubb-rs 为单 crate + `cc98`/`serde` default feature；ubb-go 为根包 + `cc98` 子包（module 名 `ubb-go` 待定址）；ubb-dotnet 为 `Ubb.Core`（net8.0）+ xUnit 测试项目。
- 附带改动：monorepo 内 `@cc98/ubb` 改名 `ubb-core` 的全仓引用同步（website、根 vite.config、docs），npm 包 `ubb-core@1.0.0` 已发布。

## 验证

- monorepo：`vp run ubb-core#test` 14 文件 230 测试通过（含 4 个语料测试）；`vp check` 全绿；`vp exec knip --include files,exports,types` 无发现
- Rust：`cargo test` 4 语料测试通过；`cargo clippy --all-targets` 0 警告；`cargo fmt --check` 通过；`cargo check --no-default-features` 通过
- Go：`go test ./...` 4 语料测试通过；`go vet`、`gofmt` 通过
- C#：`dotnet test` 4 语料测试通过，0 警告（SDK 8.0.425，装于 `~/.dotnet`）
- 交叉核对：四份语料 JSON 在 monorepo 与三个仓库副本 md5 完全一致

## 范围变化

- npm 发布提前到本计划内完成（原属发布准备）：包名因 cc98 npm org 无权限临时定为裸名 `ubb-core`（三生态均空闲），未用个人 scope，便于未来转入组织。
- website 引用与文档随包名同步修改，超出原计划但为改名必需。

## 遗留项

- GitHub 仓库、远程、CI、语料同步机器人：第二阶段
- crates.io / NuGet 发布：第二阶段
- Go module 最终路径：待 GitHub org 确定
- 未来加入 cc98 npm org 后是否迁移包名到 `@cc98/ubb`：需与团队商议，裸名包可联系 npm support 转移或加 maintainer
