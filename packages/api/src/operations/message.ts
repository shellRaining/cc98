import { z } from "zod";
import { defineOperations } from "./types.ts";
import {
  errorCodeSchema,
  replyOrAtNotificationSchema,
  systemNotificationSchema,
} from "../schemas/index.ts";

export const messageOperations = defineOperations([
  {
    method: "GET",
    path: "/notification/system",
    operationId: "getNotificationSystem",
    summary: "获取系统通知",
    tags: ["Notification"],
    parameters: [
      {
        name: "from",
        in: "query",
        required: true,
        schema: z.number().int().nonnegative(),
        description: "从第几条通知开始获取，0 表示第一条。",
        probeValue: 0,
      },
      {
        name: "size",
        in: "query",
        required: true,
        schema: z.number().int().positive(),
        description: "本次最多返回的通知数量。",
        probeValue: 2,
      },
    ],
    responses: {
      "200": {
        description: "成功获取系统通知列表",
        contentType: "application/json",
        schema: z.array(systemNotificationSchema),
      },
      default: {
        description: "API 错误码",
        contentType: "application/json",
        schema: errorCodeSchema,
      },
    },
    auth: "required",
    risk: "account-scoped",
    verificationStatus: "verified-authenticated",
    sources: ["legacy-openapi", "live-probe"],
    description:
      "分页返回当前用户收到的系统通知。通知内容使用 CC98 UBB 格式；通知关联主题或帖子时会携带相应 ID 和帖子基础信息。",
  },
  {
    method: "GET",
    path: "/notification/reply",
    operationId: "getNotificationReply",
    summary: "获取回复通知",
    tags: ["Notification"],
    parameters: [
      {
        name: "from",
        in: "query",
        required: true,
        schema: z.number().int().nonnegative(),
        description: "从第几条通知开始获取，0 表示第一条。",
        probeValue: 0,
      },
      {
        name: "size",
        in: "query",
        required: true,
        schema: z.number().int().positive(),
        description: "本次最多返回的通知数量。",
        probeValue: 2,
      },
    ],
    responses: {
      "200": {
        description: "成功获取回复通知列表",
        contentType: "application/json",
        schema: z.array(replyOrAtNotificationSchema),
      },
      default: {
        description: "API 错误码",
        contentType: "application/json",
        schema: errorCodeSchema,
      },
    },
    auth: "required",
    risk: "account-scoped",
    verificationStatus: "verified-authenticated",
    sources: ["legacy-openapi", "live-probe"],
    description:
      "分页返回其他用户回复当前用户所产生的通知，每项包含关联主题、帖子及回复者的基础信息。",
  },
  {
    method: "GET",
    path: "/notification/at",
    operationId: "getNotificationAt",
    summary: "获取 @ 提及通知",
    tags: ["Notification"],
    parameters: [
      {
        name: "from",
        in: "query",
        required: true,
        schema: z.number().int().nonnegative(),
        description: "从第几条通知开始获取，0 表示第一条。",
        probeValue: 0,
      },
      {
        name: "size",
        in: "query",
        required: true,
        schema: z.number().int().positive(),
        description: "本次最多返回的通知数量。",
        probeValue: 2,
      },
    ],
    responses: {
      "200": {
        description: "成功获取 @ 提及通知列表",
        contentType: "application/json",
        schema: z.array(replyOrAtNotificationSchema),
      },
      default: {
        description: "API 错误码",
        contentType: "application/json",
        schema: errorCodeSchema,
      },
    },
    auth: "required",
    risk: "account-scoped",
    verificationStatus: "verified-authenticated",
    sources: ["legacy-openapi", "live-probe"],
    description:
      "分页返回其他用户在主题或回复中提及当前用户所产生的通知，每项包含关联主题、帖子及提及者的基础信息。",
  },
  {
    method: "POST",
    path: "/notification/at",
    operationId: "postNotificationAt",
    summary: "发送 @ 提及通知",
    tags: ["Notification"],
    parameters: [
      {
        name: "topicid",
        in: "query",
        required: true,
        schema: z.number().int().positive(),
        description: "触发 @ 提及的主题 ID。",
        probeValue: 6572083,
      },
      {
        name: "postid",
        in: "query",
        required: true,
        schema: z.number().int().positive(),
        description: "触发 @ 提及的帖子 ID。",
        probeValue: 124447422,
      },
    ],
    requestBody: {
      required: true,
      contentType: "application/json",
      schema: z
        .array(z.string().meta({ description: "需要接收 @ 通知的用户名。" }))
        .max(10)
        .meta({ description: "被提及的用户名列表，最多包含 10 个用户名。" }),
    },
    responses: {
      "200": { description: "@ 提及通知发送请求已处理" },
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
    description:
      "在主题或回复发布成功后，向请求体中的用户发送 @ 提及通知。主题和帖子必须与实际触发提及的内容对应。",
  },
  {
    method: "PUT",
    path: "/notification/read-all-reply",
    operationId: "putNotificationReadAllReply",
    summary: "将全部回复通知标记为已读",
    tags: ["Notification"],
    parameters: [],
    responses: {
      "200": { description: "全部回复通知已标记为已读" },
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
    description: "将当前用户收到的全部回复通知标记为已读。",
  },
  {
    method: "PUT",
    path: "/notification/read-all-at",
    operationId: "putNotificationReadAllAt",
    summary: "将全部 @ 提及通知标记为已读",
    tags: ["Notification"],
    parameters: [],
    responses: {
      "200": { description: "全部 @ 提及通知已标记为已读" },
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
    description: "将当前用户收到的全部 @ 提及通知标记为已读。",
  },
  {
    method: "PUT",
    path: "/notification/read-all-system",
    operationId: "putNotificationReadAllSystem",
    summary: "将全部系统通知标记为已读",
    tags: ["Notification"],
    parameters: [],
    responses: {
      "200": { description: "全部系统通知已标记为已读" },
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
    description: "将当前用户收到的全部系统通知标记为已读。",
  },
]);
