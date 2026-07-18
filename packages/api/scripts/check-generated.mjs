import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const generatedDir = resolve(packageDir, "generated");
const temporaryDir = await mkdtemp(join(tmpdir(), "cc98-api-generated-"));
const generatedFiles = ["openapi.json", "openid.openapi.json", "endpoint-catalog.json"];

try {
  await execFileAsync(process.execPath, [
    resolve(packageDir, "scripts/generate.mjs"),
    `--output-dir=${temporaryDir}`,
  ]);

  for (const fileName of generatedFiles) {
    const [committed, current] = await Promise.all([
      readFile(resolve(generatedDir, fileName), "utf8").then(JSON.parse),
      readFile(resolve(temporaryDir, fileName), "utf8").then(JSON.parse),
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
