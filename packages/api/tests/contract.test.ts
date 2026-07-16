import { describe, expect, it } from "vite-plus/test";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import anonymousProbe from "../generated/probe-anonymous.json" with { type: "json" };
import authenticatedProbe from "../generated/probe-authenticated.json" with { type: "json" };
import openapi from "../generated/openapi.json" with { type: "json" };
import {
  endpointCatalog,
  boardSchema,
  createPostRequestSchema,
  favoriteTopicGroupSchema,
  globalConfigSchema,
  indexSchema,
  operationRegistry,
  pagedPostResultSchema,
  pagedTopicResultDataSchema,
  tagGroupSchema,
  tokenRequestSchema,
  userOperationRequestSchema,
  messageCountsSchema,
  notificationPostBasicInfoSchema,
  sendMessageRequestSchema,
} from "../src/index.ts";
import type { ApiOperation } from "../src/operations/types.ts";

describe("API 契约基线", () => {
  it("包含规范中的全部 operation", () => {
    expect(endpointCatalog).toHaveLength(136);
    expect(Object.keys(openapi.paths)).toHaveLength(116);
  });

  it("operationId 唯一且非空", () => {
    const operationIds = endpointCatalog.map((endpoint) => endpoint.operationId);
    expect(operationIds.every(Boolean)).toBe(true);
    expect(new Set(operationIds).size).toBe(operationIds.length);
  });

  it("保持 loose、strip 和 strict 的未知字段行为", () => {
    expect(globalConfigSchema.parse({ futureField: true })).toEqual({ futureField: true });
    expect(tagGroupSchema.parse({ futureField: true })).toEqual({});
    expect(() =>
      userOperationRequestSchema.parse({
        PunishmentType: 1,
        OperationType: 0,
        Reason: "test",
        futureField: true,
      }),
    ).toThrow();
  });

  it("首页聚合契约保留线上使用的栏目和统计字段", async () => {
    const fixture = JSON.parse(
      await readFile(
        resolve(import.meta.dirname, "../fixtures/anonymous/getConfigIndex.json"),
        "utf8",
      ),
    );
    const index = indexSchema.parse(fixture);
    expect(index.todayTopicCount).toBeTypeOf("number");
    expect(index.manualHotTopic?.length).toBeGreaterThan(0);
    expect(index.specialOffer?.length).toBeGreaterThan(0);
  });

  it("用户中心分页响应保留页码元数据", () => {
    const page = {
      data: [],
      count: 0,
      from: 0,
      size: 10,
      extra: null,
      errorCode: 0,
    };
    expect(pagedPostResultSchema.parse(page)).toMatchObject(page);
    expect(pagedTopicResultDataSchema.parse(page)).toMatchObject(page);
  });

  it("收藏分组包含计数和创建时间", () => {
    expect(
      favoriteTopicGroupSchema.parse({
        id: 1,
        name: "测试分组",
        count: 2,
        createTime: "2026-01-01T00:00:00Z",
      }),
    ).toMatchObject({ count: 2, createTime: "2026-01-01T00:00:00Z" });
  });

  it("版面海报允许为空", () => {
    expect(boardSchema.parse({ id: 763, bigPaper: null })).toMatchObject({
      id: 763,
      bigPaper: null,
    });
  });

  it("回帖仅在引用楼层时发送 parentId", () => {
    const request = {
      content: "测试回复",
      contentType: 1,
      title: "",
      isAnonymous: false,
      notifyAllReplier: false,
      clientType: 1,
    };
    expect(createPostRequestSchema.safeParse(request).success).toBe(true);
    expect(createPostRequestSchema.safeParse({ ...request, parentId: null }).success).toBe(false);
  });

  it("消息计数和私信发送使用收紧后的真实契约", () => {
    expect(
      messageCountsSchema.safeParse({
        systemCount: 0,
        atCount: 1,
        replyCount: 2,
        messageCount: 3,
      }).success,
    ).toBe(true);
    expect(messageCountsSchema.safeParse({ replyCount: 1 }).success).toBe(false);
    expect(sendMessageRequestSchema.safeParse({ receiverId: 2, content: "你好" }).success).toBe(
      true,
    );
    expect(
      sendMessageRequestSchema.safeParse({ receiverId: 2, userId: 2, content: "你好" }).success,
    ).toBe(false);
  });

  it("通知原始楼层信息保持为公共契约", () => {
    expect(
      notificationPostBasicInfoSchema.parse({
        id: 100,
        floor: 20,
        userId: 2,
        userName: "测试用户",
        isDeleted: false,
        boardId: 10,
      }),
    ).toMatchObject({ floor: 20, boardId: 10 });
  });

  it("Token operation 使用真实表单契约和 OpenID server", () => {
    expect(
      tokenRequestSchema.safeParse({
        client_id: "client",
        client_secret: "secret",
        grant_type: "password",
        username: "user",
        password: "password",
        scope: "cc98-api openid offline_access",
      }).success,
    ).toBe(true);
    expect(
      tokenRequestSchema.safeParse({
        client_id: "client",
        client_secret: "secret",
        grant_type: "refresh_token",
        refresh_token: "refresh-token",
      }).success,
    ).toBe(true);

    const operation = openapi.paths["/connect/token"].post;
    expect(operation.servers).toEqual([
      { url: "https://openid.cc98.org", description: "CC98 OpenID 服务" },
    ]);
    expect(operation.requestBody.content["application/x-www-form-urlencoded"].schema).toEqual({
      $ref: "#/components/schemas/TokenRequest",
    });
  });

  it("现有探测报告中的 operation 都属于 registry", () => {
    const operationIds = new Set<string>(
      operationRegistry.map((operation) => operation.operationId),
    );
    const reportedIds = [...anonymousProbe, ...authenticatedProbe].map(
      (result) => result.operationId,
    );
    expect(reportedIds.filter((operationId) => !operationIds.has(operationId))).toEqual([]);
  });

  it("只生成 operation 可达的组件 schema", () => {
    const schemas = openapi.components?.schemas ?? {};
    const reachableNames = new Set<string>();
    const visitReferences = (value: unknown) => {
      if (!value || typeof value !== "object") return;
      if ("$ref" in value && typeof value.$ref === "string") {
        const prefix = "#/components/schemas/";
        if (value.$ref.startsWith(prefix)) {
          const name = value.$ref.slice(prefix.length);
          if (reachableNames.has(name)) return;
          reachableNames.add(name);
          visitReferences(schemas[name as keyof typeof schemas]);
        }
      }
      for (const child of Object.values(value)) visitReferences(child);
    };

    visitReferences(openapi.paths);
    const componentNames = Object.keys(schemas);
    expect(componentNames.length).toBeGreaterThan(0);
    expect(componentNames.filter((name) => !reachableNames.has(name))).toEqual([]);
  });

  it("全部匿名成功响应通过对应 Zod schema", () => {
    const successfulResponses = anonymousProbe.filter(
      (result) => result.status >= 200 && result.status < 300,
    );
    expect(successfulResponses.length).toBeGreaterThan(0);
    expect(successfulResponses.filter((result) => result.validation?.status !== "passed")).toEqual(
      [],
    );
  });

  it("全部登录态 HTTP 响应通过对应 Zod schema", () => {
    expect(authenticatedProbe.length).toBeGreaterThan(0);
    expect(authenticatedProbe.filter((result) => result.validation?.status !== "passed")).toEqual(
      [],
    );
  });

  it("全部成功 fixtures 通过 registry 中的 Zod schema", async () => {
    const operations = new Map<string, ApiOperation>(
      operationRegistry.map((operation) => [operation.operationId, operation]),
    );
    const failures = [];
    for (const mode of ["anonymous", "authenticated"]) {
      const fixtureDir = resolve(import.meta.dirname, `../fixtures/${mode}`);
      for (const fileName of await readdir(fixtureDir)) {
        const operationId = fileName.replace(/\.json$/, "");
        const schema = operations.get(operationId)?.responses["200"]?.schema;
        const fixture = JSON.parse(await readFile(resolve(fixtureDir, fileName), "utf8"));
        if (!schema?.safeParse(fixture).success) failures.push(`${mode}/${operationId}`);
      }
    }
    expect(failures).toEqual([]);
  });
});
