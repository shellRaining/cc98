import { defineOperations } from "./types.ts";
import { errorCodeSchema, tokenRequestSchema, tokenResponseSchema } from "../schemas/index.ts";

export const authOperations = defineOperations([
  {
    method: "POST",
    path: "/connect/token",
    operationId: "postConnectToken",
    summary: "Login or refresh access token",
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
        description: "Token response",
        contentType: "application/json",
        schema: tokenResponseSchema,
      },
      default: {
        description: "API 错误码",
        contentType: "application/json",
        schema: errorCodeSchema,
      },
    },
    auth: "anonymous",
    risk: "write",
    verificationStatus: "unknown",
    sources: ["legacy-openapi", "live-probe"],
    description: "The frontend calls this endpoint on the configured OpenID server.",
  },
]);
