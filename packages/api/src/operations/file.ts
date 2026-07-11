import { z } from "zod";
import { defineOperations } from "./types.ts";
import { errorCodeSchema } from "../schemas/index.ts";

export const fileOperations = defineOperations([
  {
    method: "POST",
    path: "/file",
    operationId: "postFile",
    summary: "Upload files",
    tags: ["File"],
    parameters: [{ name: "compressImage", in: "query", required: false, schema: z.boolean() }],
    requestBody: {
      required: true,
      contentType: "multipart/form-data",
      schema: z.object({
        files: z.array(z.string()).optional(),
        contentType: z.string().optional(),
      }),
    },
    responses: {
      "200": {
        description: "Uploaded URLs",
        contentType: "application/json",
        schema: z.array(z.string()),
      },
      default: {
        description: "API 错误码",
        contentType: "application/json",
        schema: errorCodeSchema,
      },
    },
    auth: "required",
    risk: "write",
    verificationStatus: "unknown",
    sources: ["legacy-openapi", "live-probe"],
  },
  {
    method: "POST",
    path: "/file/portrait",
    operationId: "postFilePortrait",
    summary: "Upload portrait file",
    tags: ["File", "Me"],
    parameters: [],
    requestBody: {
      required: true,
      contentType: "multipart/form-data",
      schema: z.object({ files: z.string().optional(), contentType: z.string().optional() }),
    },
    responses: {
      "200": {
        description: "Uploaded portrait URLs",
        contentType: "application/json",
        schema: z.array(z.string()),
      },
      default: {
        description: "API 错误码",
        contentType: "application/json",
        schema: errorCodeSchema,
      },
    },
    auth: "required",
    risk: "write",
    verificationStatus: "unknown",
    sources: ["legacy-openapi", "live-probe"],
  },
]);
