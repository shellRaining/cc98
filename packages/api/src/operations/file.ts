import { z } from "zod";
import { defineOperations } from "./types.ts";
import {
  errorCodeSchema,
  fileUploadRequestSchema,
  fileUploadResponseSchema,
  portraitUploadRequestSchema,
} from "../schemas/index.ts";

export const fileOperations = defineOperations([
  {
    method: "POST",
    path: "/file",
    operationId: "postFile",
    summary: "上传文件",
    tags: ["File"],
    parameters: [
      {
        name: "compressImage",
        in: "query",
        required: false,
        schema: z.boolean(),
        description:
          "是否压缩上传的图片。省略或传入 true 时使用服务端默认压缩；传入 false 时保留原图。对非图片文件没有已确认的影响。",
      },
    ],
    requestBody: {
      required: true,
      contentType: "multipart/form-data",
      schema: fileUploadRequestSchema,
    },
    responses: {
      "200": {
        description: "上传后生成的文件地址列表",
        contentType: "application/json",
        schema: fileUploadResponseSchema,
      },
      default: {
        description: "API 错误码",
        contentType: "application/json",
        schema: errorCodeSchema,
      },
    },
    auth: "required",
    risk: "write",
    verificationStatus: "verified-write",
    sources: ["legacy-openapi", "live-probe"],
    description:
      "上传一个或多个附件，返回可嵌入主题、回复或私信内容的文件地址。图片默认由服务端压缩，可通过查询参数关闭压缩。",
  },
  {
    method: "POST",
    path: "/file/portrait",
    operationId: "postFilePortrait",
    summary: "上传头像图片",
    tags: ["File", "Me"],
    parameters: [],
    requestBody: {
      required: true,
      contentType: "multipart/form-data",
      schema: portraitUploadRequestSchema,
    },
    responses: {
      "200": {
        description: "上传后生成的头像图片地址列表",
        contentType: "application/json",
        schema: fileUploadResponseSchema,
      },
      default: {
        description: "API 错误码",
        contentType: "application/json",
        schema: errorCodeSchema,
      },
    },
    auth: "required",
    risk: "write",
    verificationStatus: "verified-write",
    sources: ["legacy-openapi", "live-probe"],
    description:
      "上传一张头像图片并返回文件地址。该接口只负责上传文件；客户端随后使用返回地址更新当前用户头像。",
  },
]);
