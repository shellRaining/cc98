/**
 * parseUbb (CC98) vs @bbob/parser 性能对比 benchmark。
 *
 * 运行方式见 README.md。
 * 依赖 dist/index.cjs（esbuild 产出）和 bench/node_modules 下的 @bbob/parser。
 *
 * 公平性说明：
 * 1. 完全相同的输入文本。
 * 2. @bbob/parser 不传 onlyAllowTags（默认解析所有标签）。
 * 3. 两者 AST 结构不同——bbob 额外记录 start/end 位置信息（每个标签 4 个数字），
 *    且默认把文本拆成单词级别。parseUbb 保留完整文本段。
 *    此对比是"各自默认行为"下的吞吐量参考，不是"同等产出"的严格对比。
 */
const { parse: bbobParse } = require("@bbob/parser");
const { parseUbb } = require("../dist/index.cjs");

// ---- 生成 UBB 文本片段（与 self.mjs 相同）----

const paragraph = [
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

const benchmarks = [
  { name: "短帖子 (~1.2KB)", text: paragraph },
  { name: "中等帖子 (~12KB)", text: paragraph.repeat(10) },
  { name: "长帖子 (~122KB)", text: paragraph.repeat(100) },
  { name: "超长帖子 (~1.2MB)", text: paragraph.repeat(1000) },
];

function bench(fn, runs) {
  fn(); // 预热
  const times = [];
  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    fn();
    times.push(performance.now() - start);
  }
  times.sort((a, b) => a - b);
  const avg = times.reduce((s, t) => s + t, 0) / times.length;
  return { avg, min: times[0], max: times[times.length - 1] };
}

console.log("=".repeat(72));
console.log("parseUbb (CC98) vs @bbob/parser 性能对比");
console.log("=".repeat(72));
console.log("");

for (const { name, text } of benchmarks) {
  const sizeKB = (new Blob([text]).size / 1024).toFixed(1);
  const runs = text.length > 100_000 ? 5 : 20;

  const ours = bench(() => parseUbb(text), runs);
  const theirs = bench(() => bbobParse(text), runs);

  const speedup = (theirs.avg / ours.avg).toFixed(1);

  console.log(`--- ${name} | ${sizeKB} KB | ${runs} 次 ---`);
  console.log(
    `  parseUbb:      ${ours.avg.toFixed(2)}ms (min ${ours.min.toFixed(2)} / max ${ours.max.toFixed(2)})`,
  );
  console.log(
    `  @bbob/parser:  ${theirs.avg.toFixed(2)}ms (min ${theirs.min.toFixed(2)} / max ${theirs.max.toFixed(2)})`,
  );
  console.log(`  倍率: ${speedup}x（${speedup >= 1 ? "我们更快" : "bbob 更快"}）`);
  console.log("");
}

console.log("=".repeat(72));
console.log("两者 AST 结构不同，此对比仅作吞吐量参考。");
console.log("  parseUbb:     完整文本段 + positionals/named 双模型 + 四种模式");
console.log("  @bbob/parser: 单词级拆分 + 额外 start/end 位置信息");
