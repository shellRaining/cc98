import { spawn, type ChildProcess } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { evaluate, type Corpus, type CorpusKind } from "./contract.ts";
import { boundaryCases, combinations } from "./inputs.ts";
import { jsonLines } from "./json-lines.ts";

/** 命令使用 JSON 数组传入，不经过 shell，带空格的路径也不需再次转义。 */
const command = JSON.parse(process.argv[2] ?? "[]") as string[];
if (
  !Array.isArray(command) ||
  command.length === 0 ||
  command.some((part) => typeof part !== "string")
) {
  throw new Error('用法：vp node conformance/compare.ts \'["可执行文件","参数"]\' [--bench]');
}
const dir = dirname(import.meta.filename);
const child = spawn(command[0], command.slice(1), { stdio: ["pipe", "pipe", "inherit"] });
const iterator = jsonLines(child.stdout);
let failure: Error | undefined;
(child as ChildProcess & { on(event: "error", listener: (error: Error) => void): void }).on(
  "error",
  (error: Error) => {
    failure = error;
  },
);
child.stdin.on("error", (error) => {
  failure = error;
});

async function request(input: string, op: string, n = 0) {
  if (failure) throw failure;
  child.stdin.write(`${JSON.stringify({ input, op, n })}\n`);
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const line = await Promise.race([
      iterator.next(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("runner 响应超过 30 秒")), 30_000);
      }),
    ]);
    if (line.done) throw failure ?? new Error("runner 提前退出");
    const result = JSON.parse(line.value) as { value?: unknown; ns?: number; error?: string };
    if (result.error !== undefined) throw new Error(result.error);
    return result;
  } finally {
    clearTimeout(timer);
  }
}

const operations: [string, CorpusKind][] = [
  ["parse", "parse-cc98"],
  ["html", "render-html"],
  ["markdown", "render-markdown"],
];
try {
  if (process.argv.includes("--bench")) {
    const benchmark = JSON.parse(readFileSync(join(dir, "benchmark.json"), "utf8")) as {
      cases: { name: string; unit: string; repeat: number; operations: string[] }[];
    };
    for (const item of benchmark.cases) {
      const input = item.unit.repeat(item.repeat);
      for (const op of item.operations) {
        const timed = async (n: number) => {
          const { ns } = await request(input, op, n);
          if (typeof ns !== "number" || !Number.isFinite(ns) || ns <= 0)
            throw new Error("runner 返回非法计时结果");
          return ns;
        };
        let ns = await timed(100);
        const until = performance.now() + 800;
        while (performance.now() < until)
          ns = await timed(Math.max(5, Math.min(200_000, Math.floor(2e8 / ns))));
        const iterations = Math.max(5, Math.min(200_000, Math.floor(2e8 / ns)));
        const samples: number[] = [];
        for (let i = 0; i < 5; i++) samples.push(await timed(iterations));
        samples.sort((a, b) => a - b);
        console.log(
          JSON.stringify({
            name: item.name,
            op,
            bytes: Buffer.byteLength(input),
            iterations,
            medianNs: samples[2],
            minNs: samples[0],
            maxNs: samples[4],
          }),
        );
      }
    }
  } else {
    let checked = 0;
    const check = async (name: string, input: string, op: string, expected: unknown) => {
      const actual = await request(input, op);
      if (!Object.hasOwn(actual, "value") || !isDeepStrictEqual(actual.value, expected)) {
        throw new Error(JSON.stringify({ name, input, op, expected, actual: actual.value }));
      }
      checked++;
    };
    for (const [op, kind] of operations) {
      const corpus = JSON.parse(readFileSync(join(dir, `${kind}.json`), "utf8")) as Corpus;
      for (const item of corpus.cases) {
        if (item.mergeAdjacentText !== undefined || item.registry !== undefined) continue;
        await check(item.name, item.input, op, item.expected);
      }
    }
    for (const item of [...boundaryCases(), ...combinations(20260928, 1024)]) {
      for (const [op, kind] of operations)
        await check(item.name, item.input, op, evaluate(kind, item));
    }
    console.log(`差分检查通过：${checked} 项；核心 registry 配置由各语言原生语料测试覆盖`);
  }
} finally {
  child.stdin.end();
  if (child.exitCode === null) child.kill();
}
