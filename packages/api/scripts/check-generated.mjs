import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const execFileAsync = promisify(execFile);
const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const generatedDir = resolve(packageDir, "generated");
const temporaryDir = await mkdtemp(join(tmpdir(), "cc98-api-generated-"));
const generatedFiles = [
  { name: "openapi.json", parse: JSON.parse },
  { name: "openid.openapi.json", parse: JSON.parse },
  { name: "endpoint-catalog.json", parse: JSON.parse },
  { name: "openapi.yaml", parse: parseYaml },
  { name: "openid.openapi.yaml", parse: parseYaml },
];

try {
  await execFileAsync(process.execPath, [
    resolve(packageDir, "scripts/generate.mjs"),
    `--output-dir=${temporaryDir}`,
  ]);

  for (const { name: fileName, parse } of generatedFiles) {
    const [committed, current] = await Promise.all([
      readFile(resolve(generatedDir, fileName), "utf8").then(parse),
      readFile(resolve(temporaryDir, fileName), "utf8").then(parse),
    ]);
    assert.deepStrictEqual(
      committed,
      current,
      `${fileName} 与当前 Zod schema / operation registry 不一致，请运行 vp run --filter @cc98/api generate`,
    );
  }
} finally {
  await rm(temporaryDir, { recursive: true, force: true });
}
