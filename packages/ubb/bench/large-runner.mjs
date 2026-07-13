import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const caseFile = fileURLToPath(new URL("./large-case.mjs", import.meta.url));
const caseNames = ["regular-1m", "regular-12m", "unclosed-text", "mismatched-deep"];
const results = [];

for (const name of caseNames) {
  const child = spawnSync(process.execPath, ["--expose-gc", caseFile, name], {
    encoding: "utf8",
    maxBuffer: 1024 * 1024,
  });

  if (child.status !== 0) {
    process.stderr.write(child.stderr);
    throw new Error(`benchmark case ${name} 执行失败`);
  }

  results.push(JSON.parse(child.stdout));
}

const megabytes = (bytes) => (bytes / 1024 / 1024).toFixed(2);
const milliseconds = (value) => value.toFixed(2);

console.table(
  results.map((result) => ({
    case: result.name,
    inputMiB: megabytes(result.bytes),
    nodes: result.nodes,
    runs: result.runs,
    medianMs: milliseconds(result.medianMs),
    p95Ms: milliseconds(result.p95Ms),
    heapMiB: megabytes(result.maxHeapGrowthBytes),
    rssMiB: megabytes(result.maxRssGrowthBytes),
  })),
);

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(results, null, 2));
}
