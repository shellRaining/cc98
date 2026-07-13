import { performance } from "node:perf_hooks";
import { parseUbb } from "../dist/index.mjs";

const mixedParagraph = [
  "[b]标题文字[/b]这里是正文内容，包含一些[i]斜体[/i]和[u]下划线[/u]以及[del]删除线[/del]。",
  "[size=5][color=red]红色大字[/color][/size]普通文字[size=3][color=blue]蓝色小字[/color][/size]。",
  "链接测试：[url=https://cc98.org]论坛首页[/url] 和 [url]https://example.com[/url]。",
  "表情测试：[ac01][ac02][ac03][em01][em02][ms01][cc9801][tb01]。",
  "[quote=某人][b]引用内容[/b]这里是引用的正文。[/quote]",
  "[code]function hello() {\n  console.log('hello world');\n  return [1, 2, 3];\n}[/code]",
  "[table][tr][th]列A[/th][th]列B[/th][/tr][tr][td]值1[/td][td]值2[/td][/tr][/table]",
  "[img]https://example.com/photo.jpg[/img][video]https://example.com/video.mp4[/video]",
  "[md]# Markdown 标题\n\n- 列表项一\n- 列表项二\n\n**粗体** 和 _斜体_。[/md]",
  "[noubb][b]这里不被解析[/b]原始内容保留[/noubb]",
  "[math]E=mc^2[/math] [m]x_{n+1}[/m] 数学公式测试。",
  "[user=张三] [topic=12345]帖子标题[/topic] [board=678]板块名[/board] [pm=李四]",
  "[align=center]居中文本[/align][left]左对齐[/left][right]右对齐[/right]",
  "[b][i][u][del]四层嵌套文本内容[/del][/u][/i][/b]",
  "[upload=jpg]https://example.com/upload.jpg[/upload][audio]https://example.com/audio.mp3[/audio]",
].join("\n\n");

const cases = {
  "regular-1m": {
    source: mixedParagraph.repeat(1000),
    runs: 7,
  },
  "regular-12m": {
    source: mixedParagraph.repeat(10000),
    runs: 3,
  },
  "unclosed-text": {
    source: "[code]未闭合内容".repeat(5000),
    runs: 5,
  },
  "mismatched-deep": {
    source: `${"[b]".repeat(3000)}${"[/i]".repeat(3000)}${"[/b]".repeat(3000)}`,
    runs: 5,
  },
};

function countNodes(nodes) {
  let count = 0;
  const stack = [...nodes];
  while (stack.length > 0) {
    const node = stack.pop();
    count += 1;
    if (node.type === "tag") stack.push(...node.children);
  }
  return count;
}

function percentile(sorted, ratio) {
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * ratio) - 1)];
}

const name = process.argv[2];
const benchmarkCase = cases[name];
if (!benchmarkCase) {
  throw new Error(`未知 benchmark case：${name ?? "<empty>"}`);
}

parseUbb("[b]预热[/b]".repeat(100));

const times = [];
let nodeCount = 0;
let maxHeapGrowth = 0;
let maxRssGrowth = 0;

for (let run = 0; run < benchmarkCase.runs; run += 1) {
  globalThis.gc?.();
  const before = process.memoryUsage();
  const startedAt = performance.now();
  let tree = parseUbb(benchmarkCase.source);
  times.push(performance.now() - startedAt);
  const after = process.memoryUsage();

  if (run === 0) nodeCount = countNodes(tree);
  maxHeapGrowth = Math.max(maxHeapGrowth, after.heapUsed - before.heapUsed);
  maxRssGrowth = Math.max(maxRssGrowth, after.rss - before.rss);
  tree = null;
}

times.sort((left, right) => left - right);

console.log(
  JSON.stringify({
    name,
    bytes: Buffer.byteLength(benchmarkCase.source),
    nodes: nodeCount,
    runs: benchmarkCase.runs,
    medianMs: times[Math.floor(times.length / 2)],
    p95Ms: percentile(times, 0.95),
    minMs: times[0],
    maxMs: times[times.length - 1],
    maxHeapGrowthBytes: maxHeapGrowth,
    maxRssGrowthBytes: maxRssGrowth,
  }),
);
