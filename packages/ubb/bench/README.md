# UBB 解析器 Benchmark

性能基准测试，覆盖 parseUbb、ubbToMarkdown、ubbToHtml 三个 API，并与 @bbob/parser 对比。

## 运行

benchmark 需要先构建 dist，且对比脚本需要单独安装 @bbob/parser（不作为项目依赖）。

```bash
# 1. 构建产物
vp pack --filter @cc98/ubb

# 2. 构建 CJS 版本（benchmark 用 CJS require）
pnpm dlx esbuild packages/ubb/src/index.ts --bundle --format=cjs --platform=node --outfile packages/ubb/dist/index.cjs

# 3. 运行自测 benchmark（parseUbb + ubbToMarkdown + ubbToHtml）
node packages/ubb/bench/self.mjs

# 4. 运行与 @bbob/parser 的对比 benchmark
cd packages/ubb/bench && npm install && cd ../../..
node packages/ubb/bench/vs-bbob.cjs
```

## 最近一次结果（2026-07-09，Node.js 24，Apple Silicon）

### 自测吞吐量

| 规模  | parseUbb             | ubbToMarkdown | ubbToHtml |
| ----- | -------------------- | ------------- | --------- |
| 1.2KB | 0.08ms (12000 ops/s) | 0.05ms        | 0.06ms    |
| 12KB  | 0.29ms (3400 ops/s)  | 0.30ms        | 0.32ms    |
| 122KB | 2.19ms (460 ops/s)   | 2.46ms        | 3.48ms    |
| 1.2MB | 28ms (35 ops/s)      | 37ms          | 46ms      |
| 6.2MB | 403ms                | 470ms         | 536ms     |

线性增长，无超线性退化。

### vs @bbob/parser

| 规模  | parseUbb | @bbob/parser | 倍率 |
| ----- | -------- | ------------ | ---- |
| 1.2KB | 0.11ms   | 0.23ms       | 2.2x |
| 12KB  | 0.32ms   | 1.07ms       | 3.3x |
| 122KB | 2.27ms   | 8.24ms       | 3.6x |
| 1.2MB | 26.75ms  | 86.18ms      | 3.2x |

所有规模下 parseUbb 比 @bbob/parser 快 2-3.6 倍。

公平性说明：两者 AST 结构不同。bbob 额外记录每个标签的 start/end 位置信息（4 个数字），且默认把文本拆成单词级别。parseUbb 保留完整文本段。此对比是"各自默认行为"下的吞吐量参考，不是"同等产出"的严格对比。
