import { defineOperations } from "./types.ts";
import {
  tokenErrorResponseSchema,
  tokenRequestSchema,
  tokenResponseSchema,
} from "../schemas/index.ts";

export const authOperations = defineOperations([
  {
    method: "POST",
    path: "/connect/token",
    operationId: "postConnectToken",
    summary: "申请或刷新访问令牌",
    tags: ["OpenID"],
    servers: [{ url: "https://openid.cc98.org", description: "CC98 OpenID 服务" }],
    parameters: [],
    requestBody: {
      required: true,
      contentType: "application/x-www-form-urlencoded",
      schema: tokenRequestSchema,
    },
    responses: {
      "200": {
        description: "OpenID 服务签发的 Token",
        contentType: "application/json",
        schema: tokenResponseSchema,
      },
      "400": {
        description: "Token 请求参数或授权凭据无效",
        contentType: "application/json",
        schema: tokenErrorResponseSchema,
      },
    },
    auth: "anonymous",
    risk: "write",
    verificationStatus: "verified-anonymous",
    sources: ["legacy-openapi", "live-probe"],
    description:
      "使用 CC98 用户名和密码申请 Access Token，或使用 Refresh Token 换取一组新 Token。该接口属于独立的 OpenID 服务，不使用论坛 API 的 Bearer 鉴权。",
  },
]);
