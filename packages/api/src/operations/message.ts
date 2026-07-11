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
    summary: "Get system notifications",
    tags: ["Notification"],
    parameters: [
      { name: "from", in: "query", required: true, schema: z.number(), probeValue: 0 },
      { name: "size", in: "query", required: true, schema: z.number(), probeValue: 2 },
    ],
    responses: {
      "200": {
        description: "System notifications",
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
  },
  {
    method: "GET",
    path: "/notification/reply",
    operationId: "getNotificationReply",
    summary: "Get reply notifications",
    tags: ["Notification"],
    parameters: [
      { name: "from", in: "query", required: true, schema: z.number(), probeValue: 0 },
      { name: "size", in: "query", required: true, schema: z.number(), probeValue: 2 },
    ],
    responses: {
      "200": {
        description: "Reply notifications",
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
  },
  {
    method: "GET",
    path: "/notification/at",
    operationId: "getNotificationAt",
    summary: "Get @ notifications",
    tags: ["Notification"],
    parameters: [
      { name: "from", in: "query", required: true, schema: z.number(), probeValue: 0 },
      { name: "size", in: "query", required: true, schema: z.number(), probeValue: 2 },
    ],
    responses: {
      "200": {
        description: "At notifications",
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
  },
  {
    method: "POST",
    path: "/notification/at",
    operationId: "postNotificationAt",
    summary: "Send @ notifications after posting",
    tags: ["Notification"],
    parameters: [
      { name: "topicid", in: "query", required: true, schema: z.number(), probeValue: 6572083 },
      { name: "postid", in: "query", required: true, schema: z.number(), probeValue: 124447422 },
    ],
    requestBody: { required: true, contentType: "application/json", schema: z.array(z.string()) },
    responses: {
      "200": { description: "Success" },
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
    method: "PUT",
    path: "/notification/read-all-reply",
    operationId: "putNotificationReadAllReply",
    summary: "Mark all reply notifications as read",
    tags: ["Notification"],
    parameters: [],
    responses: {
      "200": { description: "Success" },
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
    method: "PUT",
    path: "/notification/read-all-at",
    operationId: "putNotificationReadAllAt",
    summary: "Mark all @ notifications as read",
    tags: ["Notification"],
    parameters: [],
    responses: {
      "200": { description: "Success" },
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
    method: "PUT",
    path: "/notification/read-all-system",
    operationId: "putNotificationReadAllSystem",
    summary: "Mark all system notifications as read",
    tags: ["Notification"],
    parameters: [],
    responses: {
      "200": { description: "Success" },
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
