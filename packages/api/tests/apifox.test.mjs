import { describe, expect, test } from "vite-plus/test";
import { collectOperations, compareOperations, validateLocalSpecs } from "../scripts/apifox.mjs";

const config = {
  modules: {
    main: { server: "https://api-v2.cc98.org" },
    openid: { server: "https://openid.cc98.org" },
  },
};

const tokenRequestBody = {
  required: true,
  content: {
    "application/x-www-form-urlencoded": {
      schema: {
        type: "object",
        properties: Object.fromEntries(
          [
            "client_id",
            "client_secret",
            "grant_type",
            "username",
            "password",
            "scope",
            "refresh_token",
          ].map((field) => [field, { type: "string" }]),
        ),
      },
    },
  },
};

describe("Apifox 同步脚本", () => {
  test("从 OpenAPI 提取接口身份与认证语义", () => {
    const operations = collectOperations({
      security: [{ bearerAuth: [] }],
      paths: {
        "/public": { get: { operationId: "getPublic", security: [] } },
        "/private": { post: { operationId: "postPrivate" } },
      },
    });
    expect(operations).toMatchObject([
      { key: "GET /public", operationId: "getPublic", requiresAuthentication: false },
      { key: "POST /private", operationId: "postPrivate", requiresAuthentication: true },
    ]);
  });

  test("解析组件引用中的 token 表单字段", () => {
    const main = {
      servers: [{ url: "https://api-v2.cc98.org" }],
      paths: {},
    };
    const openid = {
      servers: [{ url: "https://openid.cc98.org" }],
      paths: {
        "/connect/token": {
          post: {
            operationId: "postConnectToken",
            security: [],
            requestBody: {
              required: true,
              content: {
                "application/x-www-form-urlencoded": {
                  schema: { $ref: "#/components/schemas/TokenFormRequest" },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          TokenFormRequest: tokenRequestBody.content["application/x-www-form-urlencoded"].schema,
        },
      },
    };

    expect(validateLocalSpecs(main, openid, config).openIdOperations).toHaveLength(1);
  });

  test("拒绝主 API 与 OpenID 重叠并检查 token 表单", () => {
    const main = {
      servers: [{ url: "https://api-v2.cc98.org" }],
      security: [{ bearerAuth: [] }],
      paths: { "/board": { get: { operationId: "getBoard" } } },
    };
    const openid = {
      servers: [{ url: "https://openid.cc98.org" }],
      security: [],
      paths: {
        "/connect/token": {
          post: { operationId: "postConnectToken", security: [], requestBody: tokenRequestBody },
        },
      },
    };
    expect(validateLocalSpecs(main, openid, config).openIdOperations).toHaveLength(1);

    const overlapping = structuredClone(openid);
    overlapping.paths["/board"] = { get: { operationId: "getBoard" } };
    expect(() => validateLocalSpecs(main, overlapping, config)).toThrow("重复 method + path");
  });

  test("分别报告缺失、残留、operationId 和认证差异", () => {
    const expected = [
      {
        key: "GET /board",
        operationId: "getBoard",
        requiresAuthentication: false,
      },
      {
        key: "GET /me",
        operationId: "getMe",
        requiresAuthentication: true,
      },
    ];
    const actual = [
      {
        key: "GET /board",
        operationId: "getBoards",
        requiresAuthentication: true,
      },
      {
        key: "GET /stale",
        operationId: "getStale",
        requiresAuthentication: false,
      },
    ];
    expect(compareOperations(expected, actual)).toEqual([
      "GET /board 的 operationId 不一致：本地 getBoard，Apifox getBoards",
      "GET /board 的认证要求不一致",
      "缺少接口 GET /me",
      "残留接口 GET /stale",
    ]);
  });
});
