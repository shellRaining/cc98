import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { createDocument } from "zod-openapi";
import { operationRegistry } from "../src/operations/index.ts";

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputDirArgument = process.argv
  .find((argument) => argument.startsWith("--output-dir="))
  ?.slice("--output-dir=".length);
const generatedDir = outputDirArgument
  ? resolve(packageDir, outputDirArgument)
  : resolve(packageDir, "generated");

function responseToOpenApi(response) {
  return {
    description: response.description,
    ...(response.schema
      ? {
          content: {
            [response.contentType ?? "application/json"]: {
              schema: response.schema,
            },
          },
        }
      : {}),
  };
}

function parametersToOpenApi(parameters) {
  const requestParams = {};
  for (const location of ["path", "query", "header", "cookie"]) {
    const entries = parameters
      .filter((parameter) => parameter.in === location)
      .map((parameter) => {
        const schema = parameter.description
          ? parameter.schema.meta({ description: parameter.description })
          : parameter.schema;
        return [
          parameter.name,
          location === "path" || parameter.required ? schema : schema.optional(),
        ];
      });
    if (entries.length > 0) requestParams[location] = z.object(Object.fromEntries(entries));
  }
  return requestParams;
}

function operationsToPaths(operations, { includeOperationServers = true } = {}) {
  const paths = {};
  for (const operation of operations) {
    const pathItem = (paths[operation.path] ??= {});
    pathItem[operation.method.toLowerCase()] = {
      operationId: operation.operationId,
      summary: operation.summary,
      ...(operation.description ? { description: operation.description } : {}),
      ...(operation.deprecated ? { deprecated: true } : {}),
      tags: operation.tags,
      ...(includeOperationServers && operation.servers ? { servers: operation.servers } : {}),
      ...(operation.parameters.length > 0
        ? { requestParams: parametersToOpenApi(operation.parameters) }
        : {}),
      ...(operation.requestBody
        ? {
            requestBody: {
              required: operation.requestBody.required,
              content: {
                [operation.requestBody.contentType]: {
                  schema: operation.requestBody.openApiSchema ?? operation.requestBody.schema,
                },
              },
            },
          }
        : {}),
      responses: Object.fromEntries(
        Object.entries(operation.responses).map(([status, response]) => [
          status,
          responseToOpenApi(response),
        ]),
      ),
      security: operation.auth === "anonymous" ? [] : [{ bearerAuth: [] }],
      "x-cc98-risk": operation.risk,
      "x-cc98-verification": operation.verificationStatus,
      "x-cc98-source": operation.sources,
    };
  }
  return paths;
}

function createOpenApiDocument({
  title,
  description,
  servers,
  security,
  operations,
  includeOperationServers,
}) {
  return createDocument({
    openapi: "3.1.0",
    info: { title, version: "0.0.0", description },
    servers,
    security,
    paths: operationsToPaths(operations, { includeOperationServers }),
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
  });
}

const openIdOperations = operationRegistry.filter((operation) =>
  operation.servers?.some((server) => server.url === "https://openid.cc98.org"),
);
const apiOperations = operationRegistry.filter(
  (operation) => !openIdOperations.includes(operation),
);
const paths = operationsToPaths(apiOperations);
const openapi = createOpenApiDocument({
  title: "CC98 API",
  description: "根据 CC98 前端调用与真实接口响应维护的公共 API 契约。",
  servers: [{ url: "https://api-v2.cc98.org", description: "CC98 正式 API" }],
  security: [{ bearerAuth: [] }],
  operations: apiOperations,
});
const openIdOpenapi = createOpenApiDocument({
  title: "CC98 OpenID API",
  description: "供 Apifox 等工具独立导入的 CC98 登录与 Token 刷新契约。",
  servers: [{ url: "https://openid.cc98.org", description: "CC98 OpenID 服务" }],
  security: [],
  operations: openIdOperations,
  includeOperationServers: false,
});

const endpointCatalog = operationRegistry
  .map((operation) => ({
    method: operation.method,
    path: operation.path,
    operationId: operation.operationId,
    summary: operation.summary,
    tags: operation.tags,
    risk: operation.risk,
    verificationStatus: operation.verificationStatus,
    requiresAuthentication: operation.auth === "required",
  }))
  .sort(
    (left, right) => left.path.localeCompare(right.path) || left.method.localeCompare(right.method),
  );

await mkdir(generatedDir, { recursive: true });
await writeFile(
  resolve(generatedDir, "endpoint-catalog.json"),
  `${JSON.stringify(endpointCatalog, null, 2)}\n`,
);
await writeFile(resolve(generatedDir, "openapi.json"), `${JSON.stringify(openapi, null, 2)}\n`);
await writeFile(
  resolve(generatedDir, "openid.openapi.json"),
  `${JSON.stringify(openIdOpenapi, null, 2)}\n`,
);

console.log(
  `生成主 API ${apiOperations.length} 个 operation、${Object.keys(paths).length} 个 path、${Object.keys(openapi.components?.schemas ?? {}).length} 个可达组件 schema；OpenID 规范包含 ${openIdOperations.length} 个 operation`,
);
