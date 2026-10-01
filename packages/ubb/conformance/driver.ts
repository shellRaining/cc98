import { cc98Registry } from "../cc98/index.ts";
import { ubbToHtml } from "../cc98/html.ts";
import { ubbToMarkdown } from "../cc98/markdown.ts";
import { canonical } from "./contract.ts";
import { jsonLines } from "./json-lines.ts";

const lines = jsonLines(process.stdin);
let sink: unknown;
try {
  for await (const line of lines) {
    try {
      const request = JSON.parse(line) as { op: string; input: string; n: number };
      if (typeof request.input !== "string" || !Number.isSafeInteger(request.n) || request.n < 0) {
        throw new Error("input 必须为字符串，n 必须为非负安全整数");
      }
      let run: () => unknown;
      switch (request.op) {
        case "parse":
          run = () => cc98Registry.parse(request.input);
          break;
        case "html":
          run = () => ubbToHtml(request.input);
          break;
        case "markdown":
          run = () => ubbToMarkdown(request.input);
          break;
        default:
          throw new Error("未知 op");
      }
      if (request.n === 0) {
        const value =
          request.op === "parse" ? cc98Registry.parse(request.input).map(canonical) : run();
        console.log(JSON.stringify({ value }));
      } else {
        const start = performance.now();
        for (let i = 0; i < request.n; i++) sink = run();
        console.log(JSON.stringify({ ns: ((performance.now() - start) * 1e6) / request.n }));
      }
    } catch (error) {
      console.log(JSON.stringify({ error: String(error) }));
    }
  }
} finally {
  await lines.return();
}
// 保持结果可观察，避免纯计算循环被优化掉；不影响 stdout 协议。
if (sink === Symbol.for("ubb-benchmark-unreachable")) process.exitCode = 1;
