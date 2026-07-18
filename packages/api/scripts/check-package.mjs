import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const workspaceDir = resolve(packageDir, "../..");
const vitePlusBin = resolve(homedir(), ".vite-plus/bin/vp");
const temporaryDir = await mkdtemp(resolve(tmpdir(), "cc98-api-package-"));

try {
  await execFileAsync(vitePlusBin, ["pm", "pack", "--pack-destination", temporaryDir], {
    cwd: packageDir,
  });
  const tarballName = (await readdir(temporaryDir)).find((name) => name.endsWith(".tgz"));
  assert.ok(tarballName, "没有生成 npm tarball");
  const tarball = resolve(temporaryDir, tarballName);
  const { stdout: listing } = await execFileAsync("tar", ["-tzf", tarball]);

  for (const expected of [
    "package/dist/index.mjs",
    "package/dist/index.d.mts",
    "package/generated/openapi.json",
    "package/generated/openapi.yaml",
    "package/generated/openid.openapi.json",
    "package/generated/openid.openapi.yaml",
    "package/generated/endpoint-catalog.json",
    "package/README.md",
    "package/LICENSE",
    "package/CHANGELOG.md",
    "package/package.json",
  ]) {
    assert.ok(listing.includes(expected), `发布包缺少 ${expected}`);
  }
  for (const forbidden of ["package/src/", "package/scripts/", "package/fixtures/"]) {
    assert.ok(!listing.includes(forbidden), `发布包不应包含 ${forbidden}`);
  }

  await writeFile(
    resolve(temporaryDir, "package.json"),
    `${JSON.stringify({ private: true, type: "module" }, null, 2)}\n`,
  );
  await writeFile(
    resolve(temporaryDir, "index.mjs"),
    `import { boardSchema } from "@cc98/api";
import openapi from "@cc98/api/openapi.json" with { type: "json" };
import catalog from "@cc98/api/catalog" with { type: "json" };

boardSchema.parse({ id: 1, name: "测试版面" });
if (!openapi.paths["/board/{boardId}"]) throw new Error("OpenAPI 导出不可用");
if (!catalog.some((operation) => operation.operationId === "getBoardBoardId")) {
  throw new Error("接口目录导出不可用");
}
`,
  );
  await execFileAsync(
    vitePlusBin,
    [
      "env",
      "exec",
      "--node",
      "24.18.0",
      "pnpm",
      "--dir",
      temporaryDir,
      "add",
      tarball,
      "zod@4.4.3",
      "--ignore-scripts",
    ],
    { cwd: workspaceDir },
  );
  await execFileAsync(
    vitePlusBin,
    ["env", "exec", "--node", "24.18.0", "node", resolve(temporaryDir, "index.mjs")],
    { cwd: workspaceDir },
  );

  console.log("发布包内容与外部项目导入验证通过");
} finally {
  await rm(temporaryDir, { recursive: true, force: true });
}
