import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { operationRegistry } from "../src/operations/index.ts";

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const generatedDir = resolve(packageDir, "generated");
const mode = process.argv.includes("--authenticated") ? "authenticated" : "anonymous";
const onlyOperation = process.argv.find((argument) => argument.startsWith("--only="))?.slice(7);
const authRequiredOnly = process.argv.includes("--auth-required");
const authBlockedOnly = process.argv.includes("--auth-blocked");
let token = process.env.CC98_ACCESS_TOKEN;
if (!token && process.env.CC98_ACCESS_TOKEN_FILE) {
  token = (await readFile(resolve(process.env.CC98_ACCESS_TOKEN_FILE), "utf8")).trim();
}
let anonymousProbe = [];
try {
  anonymousProbe = JSON.parse(
    await readFile(resolve(generatedDir, "probe-anonymous.json"), "utf8"),
  );
} catch {
  anonymousProbe = [];
}
const anonymousStatus = new Map(
  anonymousProbe.map((result) => [result.operationId, result.status]),
);
const fixtureDir = resolve(packageDir, "fixtures", mode);
const reportPath = resolve(generatedDir, `probe-${mode}.json`);
let authHeaderDir;
let authHeaderPath;

function sanitize(value, key = "") {
  if (value === null || typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.map((item) => sanitize(item, key));
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, child]) => [childKey, sanitize(child, childKey)]),
    );
  }
  if (typeof value !== "string") return value;
  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return "2026-01-01T00:00:00Z";
  if (/^https?:\/\//.test(value)) return "https://example.com/redacted";
  if (key.toLowerCase().includes("content")) return "<redacted-content>";
  return "<redacted>";
}

function responseSchemaFor(operation, status) {
  return operation.responses[String(status)]?.schema ?? operation.responses.default?.schema;
}

function validateResponse(operation, status, body) {
  const responseSchema = responseSchemaFor(operation, status);
  if (!responseSchema) {
    return status >= 200 && status < 300 ? { status: "passed" } : { status: "missing-schema" };
  }
  const result = responseSchema.safeParse(body);
  if (result.success) return { status: "passed" };
  return {
    status: "failed",
    issues: result.error.issues.slice(0, 20).map((issue) => ({
      path: issue.path.join("."),
      code: issue.code,
      message: issue.message,
    })),
  };
}

function parameterValue(parameter) {
  if (parameter.probeValue !== undefined) {
    if (parameter.schema.safeParse(parameter.probeValue).success) return parameter.probeValue;
    if (parameter.schema.safeParse([parameter.probeValue]).success) return [parameter.probeValue];
    return parameter.probeValue;
  }
  for (const candidate of [1, 0, true, false, "test"]) {
    if (parameter.schema.safeParse(candidate).success) return candidate;
  }
  return "test";
}

function buildUrl(operation) {
  let resolvedPath = operation.path;
  const query = new URLSearchParams();
  for (const parameter of operation.parameters) {
    const value = parameterValue(parameter);
    if (parameter.in === "path") {
      resolvedPath = resolvedPath.replace(`{${parameter.name}}`, encodeURIComponent(String(value)));
    } else if (
      parameter.in === "query" &&
      (parameter.required || parameter.probeValue !== undefined)
    ) {
      for (const item of Array.isArray(value) ? value : [value]) {
        query.append(parameter.name, String(item));
      }
    }
  }
  const url = new URL(resolvedPath, "https://api-v2.cc98.org");
  for (const [name, value] of query) url.searchParams.append(name, value);
  return url;
}

function requestWithCurl(url, headerPath) {
  return new Promise((resolveRequest, rejectRequest) => {
    const args = [
      "--silent",
      "--show-error",
      "--max-time",
      "20",
      "--retry",
      "2",
      "--retry-all-errors",
      "--retry-delay",
      "1",
      "--request",
      "GET",
      "--header",
      "Accept: application/json",
    ];
    if (headerPath) args.push("--header", `@${headerPath}`);
    args.push("--write-out", "\n%{http_code}\t%{content_type}", url.toString());
    const child = spawn("curl", args, { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.on("error", rejectRequest);
    child.on("close", (code) => {
      if (code !== 0) return rejectRequest(new Error(stderr.trim() || `curl 退出码 ${code}`));
      const markerIndex = stdout.lastIndexOf("\n");
      const bodyText = stdout.slice(0, markerIndex);
      const [statusText, contentType = ""] = stdout.slice(markerIndex + 1).split("\t");
      let body = bodyText;
      if (contentType.includes("json") && bodyText) {
        try {
          body = JSON.parse(bodyText);
        } catch {
          body = bodyText;
        }
      }
      resolveRequest({ status: Number(statusText), contentType, body });
    });
    child.stdin.end();
  });
}

try {
  if (mode === "authenticated" && !token) {
    throw new Error("authenticated 模式需要 CC98_ACCESS_TOKEN 或 CC98_ACCESS_TOKEN_FILE");
  }
  if (token) {
    authHeaderDir = await mkdtemp(join(tmpdir(), "cc98-api-probe-"));
    authHeaderPath = resolve(authHeaderDir, "authorization-header");
    await writeFile(authHeaderPath, `Authorization: Bearer ${token}\n`, { mode: 0o600 });
  }

  if (mode === "authenticated") {
    const preflight = await requestWithCurl(
      new URL("/me", "https://api-v2.cc98.org"),
      authHeaderPath,
    );
    if (preflight.status === 401) {
      throw new Error("登录 token 已失效，未执行探测，也不会覆盖现有报告");
    }
  }

  await mkdir(fixtureDir, { recursive: true });
  const results = [];
  for (const operation of operationRegistry) {
    if (operation.method !== "GET") continue;
    if (onlyOperation && operation.operationId !== onlyOperation) continue;
    if (authRequiredOnly && operation.auth !== "required") continue;
    if (authBlockedOnly && anonymousStatus.get(operation.operationId) !== 401) continue;
    const url = buildUrl(operation);
    const startedAt = Date.now();
    try {
      const response = await requestWithCurl(url, authHeaderPath);
      const body = response.body;
      const result = {
        operationId: operation.operationId,
        method: operation.method,
        path: operation.path,
        url: url.toString(),
        status: response.status,
        durationMs: Date.now() - startedAt,
        contentType: response.contentType,
        bodyType: Array.isArray(body) ? "array" : body === null ? "null" : typeof body,
        validation: validateResponse(operation, response.status, body),
      };
      results.push(result);
      if (response.status >= 200 && response.status < 300) {
        await writeFile(
          resolve(fixtureDir, `${operation.operationId}.json`),
          `${JSON.stringify(sanitize(body), null, 2)}\n`,
        );
      }
      console.log(`${response.status} ${operation.operationId} ${url.pathname}${url.search}`);
    } catch (error) {
      results.push({
        operationId: operation.operationId,
        method: operation.method,
        path: operation.path,
        url: url.toString(),
        status: 0,
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error),
      });
      console.log(
        `ERR ${operation.operationId} ${url.pathname}${url.search} ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 150));
  }

  let reportResults = results;
  if (onlyOperation) {
    let existingResults = [];
    try {
      existingResults = JSON.parse(await readFile(reportPath, "utf8"));
    } catch {
      existingResults = [];
    }
    reportResults = [
      ...existingResults.filter((result) => result.operationId !== onlyOperation),
      ...results,
    ].sort((left, right) => left.operationId.localeCompare(right.operationId));
  }
  await writeFile(reportPath, `${JSON.stringify(reportResults, null, 2)}\n`);
  const statusCounts = Object.groupBy(results, (result) => String(result.status));
  console.log(
    Object.entries(statusCounts)
      .map(([status, entries]) => `${status}: ${entries.length}`)
      .sort()
      .join("\n"),
  );
} finally {
  if (authHeaderDir) await rm(authHeaderDir, { recursive: true, force: true });
}
