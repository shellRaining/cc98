import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const configPath = resolve(packageDir, "apifox.config.json");
const generatedCheckPath = resolve(packageDir, "scripts/check-generated.mjs");
const httpMethods = new Set(["get", "post", "put", "patch", "delete", "head", "options", "trace"]);

function parseCliJson(output) {
  const start = output.indexOf("{");
  if (start < 0) throw new Error(`Apifox CLI 没有返回 JSON：${output.trim()}`);
  return JSON.parse(output.slice(start));
}

function operationKey(method, path) {
  return `${method.toUpperCase()} ${path}`;
}

function operationRequiresAuthentication(document, operation) {
  const security = operation.security ?? document.security ?? [];
  return Array.isArray(security) && security.length > 0;
}

function resolveSchema(document, schema) {
  if (!schema?.$ref?.startsWith("#/")) return schema;
  return schema.$ref
    .slice(2)
    .split("/")
    .reduce(
      (value, segment) => value?.[segment.replaceAll("~1", "/").replaceAll("~0", "~")],
      document,
    );
}

function schemaPropertyNames(document, schema, seen = new Set()) {
  const resolved = resolveSchema(document, schema);
  if (!resolved || seen.has(resolved)) return new Set();
  seen.add(resolved);
  const names = new Set(Object.keys(resolved.properties ?? {}));
  for (const branch of [
    ...(resolved.oneOf ?? []),
    ...(resolved.anyOf ?? []),
    ...(resolved.allOf ?? []),
  ]) {
    for (const name of schemaPropertyNames(document, branch, seen)) names.add(name);
  }
  return names;
}

export function collectOperations(document) {
  const operations = [];
  for (const [path, pathItem] of Object.entries(document.paths ?? {})) {
    for (const [method, operation] of Object.entries(pathItem ?? {})) {
      if (!httpMethods.has(method) || !operation || typeof operation !== "object") continue;
      operations.push({
        key: operationKey(method, path),
        method: method.toUpperCase(),
        path,
        operationId: operation.operationId ?? "",
        requiresAuthentication: operationRequiresAuthentication(document, operation),
        requestBody: operation.requestBody,
      });
    }
  }
  return operations.sort((left, right) => left.key.localeCompare(right.key));
}

export function validateLocalSpecs(mainSpec, openIdSpec, config) {
  const mainOperations = collectOperations(mainSpec);
  const openIdOperations = collectOperations(openIdSpec);
  const mainKeys = new Set(mainOperations.map((operation) => operation.key));
  const overlap = openIdOperations.filter((operation) => mainKeys.has(operation.key));
  assert.deepStrictEqual(overlap, [], "主 API 与 OpenID 规范存在重复 method + path");
  assert.equal(
    mainSpec.servers?.[0]?.url,
    config.modules.main.server,
    "主 API server 与 Apifox 配置不一致",
  );
  assert.equal(
    openIdSpec.servers?.[0]?.url,
    config.modules.openid.server,
    "OpenID server 与 Apifox 配置不一致",
  );
  assert.deepStrictEqual(
    openIdOperations.map((operation) => operation.operationId),
    ["postConnectToken"],
    "OpenID 规范只能包含 postConnectToken",
  );
  assert.equal(
    openIdOperations[0]?.requiresAuthentication,
    false,
    "OpenID token 接口不能要求 Bearer",
  );

  const tokenBody =
    openIdOperations[0]?.requestBody?.content?.["application/x-www-form-urlencoded"];
  assert.ok(tokenBody, "/connect/token 必须使用 application/x-www-form-urlencoded");
  assert.equal(
    openIdOperations[0]?.requestBody?.required,
    true,
    "/connect/token 请求体必须标为必填",
  );
  const properties = schemaPropertyNames(openIdSpec, tokenBody.schema);
  for (const field of [
    "client_id",
    "client_secret",
    "grant_type",
    "username",
    "password",
    "scope",
    "refresh_token",
  ]) {
    assert.ok(properties.has(field), `/connect/token 缺少字段 ${field}`);
  }

  return { mainOperations, openIdOperations };
}

export function compareOperations(expected, actual) {
  const expectedByKey = new Map(expected.map((operation) => [operation.key, operation]));
  const actualByKey = new Map(actual.map((operation) => [operation.key, operation]));
  const differences = [];

  for (const [key, operation] of expectedByKey) {
    const remote = actualByKey.get(key);
    if (!remote) {
      differences.push(`缺少接口 ${key}`);
      continue;
    }
    if (remote.operationId !== operation.operationId) {
      differences.push(
        `${key} 的 operationId 不一致：本地 ${operation.operationId}，Apifox ${remote.operationId}`,
      );
    }
    if (remote.requiresAuthentication !== operation.requiresAuthentication) {
      differences.push(`${key} 的认证要求不一致`);
    }
  }
  for (const key of actualByKey.keys()) {
    if (!expectedByKey.has(key)) differences.push(`残留接口 ${key}`);
  }
  return differences;
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function loadContext() {
  const config = await readJson(configPath);
  const [mainSpec, openIdSpec] = await Promise.all([
    readJson(resolve(packageDir, config.modules.main.spec)),
    readJson(resolve(packageDir, config.modules.openid.spec)),
  ]);
  const operations = validateLocalSpecs(mainSpec, openIdSpec, config);
  return { config, mainSpec, openIdSpec, ...operations };
}

async function apifoxEntry() {
  const packageJsonPath = fileURLToPath(import.meta.resolve("apifox-cli/package.json"));
  const packageJson = await readJson(packageJsonPath);
  assert.equal(packageJson.version, "2.2.7", "Apifox CLI 版本与计划验证版本不一致");
  return resolve(dirname(packageJsonPath), packageJson.bin.apifox);
}

async function runCli(args) {
  let output;
  try {
    const { stdout, stderr } = await execFileAsync(
      process.execPath,
      [await apifoxEntry(), ...args],
      {
        cwd: packageDir,
        maxBuffer: 30 * 1024 * 1024,
      },
    );
    output = stdout || stderr;
  } catch (error) {
    output = `${error.stdout ?? ""}${error.stderr ?? ""}`;
    if (!output.trim()) throw error;
  }
  const result = parseCliJson(output);
  if (!result.success) {
    const error = new Error(result.error?.message ?? "Apifox CLI 操作失败");
    error.code = result.error?.code;
    error.result = result;
    throw error;
  }
  return result;
}

async function checkGeneratedFiles() {
  await execFileAsync(process.execPath, [generatedCheckPath], { cwd: packageDir });
}

async function readRemoteContext(config) {
  await runCli(["auth", "whoami"]);
  const [project, branches] = await Promise.all([
    runCli(["project", "get", String(config.projectId)]),
    runCli(["branch", "list", "--project", String(config.projectId), "--type", "all"]),
  ]);
  const mainBranch = branches.data.find((branch) => branch.name === config.branch && branch.isMain);
  assert.ok(mainBranch, `Apifox 项目缺少主分支 ${config.branch}`);
  for (const module of Object.values(config.modules)) {
    const remote = project.data.modules.find((candidate) => candidate.id === module.id);
    assert.equal(remote?.name, module.name, `Apifox 模块 ${module.id} 的名称不一致`);
  }
  return { project: project.data, mainBranch };
}

async function listEndpoints(config, moduleId) {
  const first = await runCli([
    "endpoint",
    "list",
    "--project",
    String(config.projectId),
    "--branch",
    config.branch,
    "--module-id",
    String(moduleId),
    "--page",
    "1",
    "--page-size",
    "500",
  ]);
  const endpoints = [...first.data];
  for (let page = 2; page <= (first.meta.totalPages ?? 1); page += 1) {
    const result = await runCli([
      "endpoint",
      "list",
      "--project",
      String(config.projectId),
      "--branch",
      config.branch,
      "--module-id",
      String(moduleId),
      "--page",
      String(page),
      "--page-size",
      "500",
    ]);
    endpoints.push(...result.data);
  }
  return endpoints;
}

async function exportModule(config, module, output) {
  await runCli([
    "export",
    "--project",
    String(config.projectId),
    "--branch",
    config.branch,
    "--format",
    "openapi",
    "--oas-version",
    "3.1",
    "--module-id",
    String(module.id),
    "--output",
    output,
  ]);
  return readJson(output);
}

async function listSecuritySchemes(config) {
  const listed = await runCli([
    "security-scheme",
    "list",
    "--project",
    String(config.projectId),
    "--branch",
    config.branch,
  ]);
  return Promise.all(
    listed.data.map(async (scheme) => {
      const detail = await runCli([
        "security-scheme",
        "get",
        String(scheme.id),
        "--project",
        String(config.projectId),
        "--branch",
        config.branch,
      ]);
      return detail.data;
    }),
  );
}

function duplicateEndpointDifferences(endpoints, moduleName) {
  const grouped = Map.groupBy(endpoints, (endpoint) =>
    operationKey(endpoint.method, endpoint.path),
  );
  return [...grouped.entries()]
    .filter(([, matches]) => matches.length > 1)
    .map(([key, matches]) => `${moduleName} 中 ${key} 重复 ${matches.length} 次`);
}

async function verifyRemote(context) {
  const { config, mainOperations, openIdOperations } = context;
  await readRemoteContext(config);
  const temporaryDir = await mkdtemp(resolve(tmpdir(), "cc98-apifox-verify-"));
  try {
    const [mainEndpoints, openIdEndpoints, mainExport, openIdExport, environments, schemes] =
      await Promise.all([
        listEndpoints(config, config.modules.main.id),
        listEndpoints(config, config.modules.openid.id),
        exportModule(config, config.modules.main, resolve(temporaryDir, "main.json")),
        exportModule(config, config.modules.openid, resolve(temporaryDir, "openid.json")),
        runCli(["environment", "list", "--project", String(config.projectId)]),
        listSecuritySchemes(config),
      ]);

    const differences = [
      ...duplicateEndpointDifferences(mainEndpoints, config.modules.main.name),
      ...duplicateEndpointDifferences(openIdEndpoints, config.modules.openid.name),
      ...compareOperations(mainOperations, collectOperations(mainExport)),
      ...compareOperations(openIdOperations, collectOperations(openIdExport)),
    ];
    if (mainEndpoints.some((endpoint) => endpoint.path === "/connect/token")) {
      differences.push("主 API 模块不应包含 /connect/token");
    }
    if (
      openIdEndpoints.length !== 1 ||
      openIdEndpoints[0]?.path !== "/connect/token" ||
      openIdEndpoints[0]?.method.toLowerCase() !== "post"
    ) {
      differences.push("OpenID 模块只能包含 POST /connect/token");
    }

    const tokenOperation = collectOperations(openIdExport).find(
      (operation) => operation.key === "POST /connect/token",
    );
    const tokenSchema =
      tokenOperation?.requestBody?.content?.["application/x-www-form-urlencoded"]?.schema;
    const tokenProperties = schemaPropertyNames(openIdExport, tokenSchema);
    for (const field of [
      "client_id",
      "client_secret",
      "grant_type",
      "username",
      "password",
      "scope",
      "refresh_token",
    ]) {
      if (!tokenProperties.has(field)) differences.push(`/connect/token 缺少字段 ${field}`);
    }

    const development = environments.data.find((environment) => environment.name === "开发环境");
    if (development?.baseUrls?.default !== config.modules.main.server) {
      differences.push("开发环境的主 API 地址不一致");
    }
    if (
      development?.baseUrls?.[String(config.modules.openid.id)] !== config.modules.openid.server
    ) {
      differences.push("开发环境的 OpenID 地址不一致");
    }

    const mainSchemes = schemes.filter((scheme) => scheme.moduleId === config.modules.main.id);
    const openIdSchemes = schemes.filter((scheme) => scheme.moduleId === config.modules.openid.id);
    if (
      mainSchemes.length !== 1 ||
      mainSchemes[0]?.authConfigs?.scheme !== "bearer" ||
      mainSchemes[0]?.authConfigs?.bearerFormat !== "JWT"
    ) {
      differences.push("主 API 模块应只有一个 Bearer JWT 鉴权组件");
    }
    if (openIdSchemes.length > 0) differences.push("OpenID 模块不应包含 Bearer 鉴权组件");

    if (differences.length > 0) {
      throw new Error(`Apifox 结构验证失败：\n- ${differences.join("\n- ")}`);
    }
    console.log(
      `Apifox 验证通过：主 API ${mainEndpoints.length} 个接口，OpenID ${openIdEndpoints.length} 个接口`,
    );
  } finally {
    await rm(temporaryDir, { recursive: true, force: true });
  }
}

async function deleteResource(config, resource, id) {
  try {
    await runCli([
      resource,
      "delete",
      String(id),
      "--project",
      String(config.projectId),
      "--branch",
      config.branch,
    ]);
  } catch (error) {
    if (error.code === "403075") {
      throw new Error(
        `Apifox 拒绝删除 ${resource} ${id}。请在项目设置中开启外部 AI 直接编辑权限后重试。`,
      );
    }
    throw error;
  }
}

async function cleanEndpointModule(config, module, expectedOperations) {
  const expected = new Set(expectedOperations.map((operation) => operation.key));
  const endpoints = await listEndpoints(config, module.id);
  const grouped = Map.groupBy(endpoints, (endpoint) =>
    operationKey(endpoint.method, endpoint.path),
  );

  for (const [key, matches] of grouped) {
    if (!expected.has(key)) {
      for (const endpoint of matches) await deleteResource(config, "endpoint", endpoint.id);
      continue;
    }
    for (const duplicate of matches.slice(1)) {
      await deleteResource(config, "endpoint", duplicate.id);
    }
  }
}

async function cleanSecuritySchemes(config) {
  const schemes = await listSecuritySchemes(config);
  const mainSchemes = schemes.filter((scheme) => scheme.moduleId === config.modules.main.id);
  const openIdSchemes = schemes.filter((scheme) => scheme.moduleId === config.modules.openid.id);
  for (const duplicate of mainSchemes.slice(1)) {
    await deleteResource(config, "security-scheme", duplicate.id);
  }
  for (const scheme of openIdSchemes) {
    await deleteResource(config, "security-scheme", scheme.id);
  }
}

async function importSpec(config, module) {
  await runCli([
    "import",
    "--project",
    String(config.projectId),
    "--branch",
    config.branch,
    "--format",
    "openapi",
    "--file",
    resolve(packageDir, module.spec),
  ]);
}

async function check(context) {
  await checkGeneratedFiles();
  const remote = await readRemoteContext(context.config);
  console.log(
    `Apifox 预检通过：项目 ${remote.project.name}，准备同步主 API ${context.mainOperations.length} 个接口、OpenID ${context.openIdOperations.length} 个接口`,
  );
}

async function sync(context) {
  await check(context);
  await cleanEndpointModule(context.config, context.config.modules.main, context.mainOperations);
  await cleanEndpointModule(
    context.config,
    context.config.modules.openid,
    context.openIdOperations,
  );
  await cleanSecuritySchemes(context.config);
  await importSpec(context.config, context.config.modules.main);
  await importSpec(context.config, context.config.modules.openid);
  await verifyRemote(context);
}

async function main() {
  const command = process.argv[2];
  if (!new Set(["check", "sync", "verify"]).has(command)) {
    throw new Error("用法：node scripts/apifox.mjs <check|sync|verify>");
  }
  const context = await loadContext();
  if (command === "check") await check(context);
  if (command === "sync") await sync(context);
  if (command === "verify") {
    await checkGeneratedFiles();
    await verifyRemote(context);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
