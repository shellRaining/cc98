# UBB 解析器 Benchmark

性能基准覆盖 `parseUbb`、`ubbToMarkdown`、`ubbToHtml` 三个 API。常规微基准使用 Vitest benchmark，大输入和异常输入使用独立 Node.js 进程，避免不同样本共享堆状态。

## 运行

### 常规微基准

```bash
vp run @cc98/ubb#bench -- --run
```

Vitest 会负责预热和重复采样，输出吞吐量、均值、分位数、误差范围和样本数。当前样本覆盖纯文本、常规混合标签、高节点密度内容，以及 Markdown、HTML 两种导出器。

### 大输入和异常输入

```bash
vp run @cc98/ubb#bench:large
```

runner 会先构建 `dist`，再为每个样本启动独立进程。输出包括 UTF-8 输入字节数、AST 节点数、median、p95、heapUsed 增量和 RSS 增量。

当前包含四类样本：

| 样本              | 目的                                 |
| ----------------- | ------------------------------------ |
| `regular-1m`      | 约 1.2MiB 的常规混合标签             |
| `regular-12m`     | 约 11.9MiB 的常规混合标签            |
| `unclosed-text`   | 连续未闭合的 Text 模式标签           |
| `mismatched-deep` | 深嵌套并带错配结束标签的错误恢复路径 |

大输入结果也可以输出 JSON，便于保存到外部报告：

```bash
vp run @cc98/ubb#bench:large -- --json
```

### 与 `@bbob/parser` 对比

对比脚本保留为可选的人工分析工具。它不属于项目主依赖，也不进入日常检查。

```bash
# 1. 构建项目产物和对比脚本需要的 CJS 入口
vp pack --filter @cc98/ubb
vp dlx esbuild packages/ubb/src/index.ts --bundle --format=cjs --platform=node --outfile=packages/ubb/dist/index.cjs

# 2. 安装隔离的对比依赖
cd packages/ubb/bench
vp env exec npm install
cd ../../..

# 3. 运行对比
vp node packages/ubb/bench/vs-bbob.cjs
```

## 如何解释结果

旧文档把 10000 倍混合样本写成 6.2MB，实际 UTF-8 大小约为 12.2MB，也就是 11.93MiB。错误标签会让 1.2MB 到大样本的增长比例看起来偏离线性。

即使输入和节点数按固定比例增长，耗时也不会严格同比变化。大对象分配、垃圾回收、CPU 缓存、JIT 状态和系统负载都会在大样本中放大。判断复杂度时应同时观察输入字节数、节点数、多个规模的 median 和 p95，不能根据两次手测直接写成“线性”或“发生 O(n²) 退化”。

Vitest 微基准适合比较常见帖子和不同实现的稳定吞吐量。独立进程 runner 用于观察大输入、内存和错误恢复路径，两者的统计模型不同，不应把结果混成一张倍率表。

## 对比边界

`parseUbb` 和 `@bbob/parser` 的 AST 结构不同。bbob 额外记录每个标签的 start/end 位置，并默认把文本拆成单词级节点；`parseUbb` 保留完整文本段。对比结果只能代表各自默认行为下的吞吐量，不能当作同等产出的严格性能差异。
