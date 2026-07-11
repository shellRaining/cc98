import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const baseline = new Set(
  JSON.parse(readFileSync(new URL("../knip-baseline.json", import.meta.url))),
);
const executable = process.platform === "win32" ? "knip.cmd" : "knip";
const result = spawnSync(
  executable,
  ["--include", "exports,types", "--reporter", "json", "--no-progress", "--no-exit-code"],
  { encoding: "utf8" },
);

if (result.error) throw result.error;
if (result.stderr) process.stderr.write(result.stderr);

const report = JSON.parse(result.stdout);
const current = new Map();

for (const issue of report.issues) {
  for (const type of ["exports", "types"]) {
    for (const symbol of issue[type]) {
      const key = `${type}:${issue.file}:${symbol.name}`;
      current.set(key, { ...symbol, file: issue.file, type });
    }
  }
}

const added = [...current.entries()].filter(([key]) => !baseline.has(key));
const resolved = [...baseline].filter((key) => !current.has(key));

if (resolved.length > 0) {
  console.log("Knip 基线中已有问题被清理，可从 knip-baseline.json 删除：");
  for (const key of resolved) console.log(`  - ${key}`);
}

if (added.length === 0) {
  console.log(`Knip 检查通过（保留 ${current.size} 项历史基线）。`);
  process.exit(0);
}

console.error("Knip 发现新增的未使用导出：");
for (const [, issue] of added) {
  console.error(`  - ${issue.file}:${issue.line} ${issue.type} ${issue.name}`);
}
process.exit(1);
