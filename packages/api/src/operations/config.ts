import { z } from "zod";
import { defineOperations } from "./types.ts";
import {
  displayTitleSchema,
  errorCodeSchema,
  globalConfigSchema,
  indexSchema,
  indexColumnSchema,
  serverTimeResponseSchema,
  tagSchema,
} from "../schemas/index.ts";

export const configOperations = defineOperations([
  {
    method: "GET",
    path: "/config/global",
    operationId: "getConfigGlobal",
    summary: "获取论坛全局配置",
    tags: ["Config"],
    parameters: [],
    responses: {
      "200": {
        description: "成功获取论坛全局运行配置与统计信息",
        contentType: "application/json",
        schema: globalConfigSchema,
      },
      default: {
        description: "API 错误码",
        contentType: "application/json",
        schema: errorCodeSchema,
      },
    },
    auth: "anonymous",
    risk: "read-only",
    verificationStatus: "verified-anonymous",
    sources: ["legacy-openapi", "live-probe"],
    description:
      "返回论坛运行状态、全站统计、公告、签到和生日活动等全局配置。后端可能省略部分字段或返回额外字段。",
  },
  {
    method: "PUT",
    path: "/config/global/announcement",
    operationId: "putConfigGlobalAnnouncement",
    summary: "更新全站公告",
    tags: ["Config", "Moderation"],
    parameters: [],
    requestBody: {
      required: true,
      contentType: "application/json",
      schema: z.object({
        announcement: z.string().meta({ description: "新的全站公告内容，使用 CC98 UBB 格式。" }),
      }),
    },
    responses: {
      "200": { description: "公告更新成功" },
      default: {
        description: "API 错误码",
        contentType: "application/json",
        schema: errorCodeSchema,
      },
    },
    auth: "required",
    risk: "destructive",
    verificationStatus: "unknown",
    sources: ["legacy-openapi", "live-probe"],
    description: "更新 `/config/global` 和首页聚合数据中展示的全站公告。需要站点管理权限。",
  },
  {
    method: "GET",
    path: "/config/global/advertisement",
    operationId: "getConfigGlobalAdvertisement",
    summary: "获取首页 Banner",
    tags: ["Config", "Index"],
    parameters: [],
    responses: {
      "200": {
        description: "成功获取当前可展示的首页 Banner 列表",
        contentType: "application/json",
        schema: z.array(indexColumnSchema),
      },
      default: {
        description: "API 错误码",
        contentType: "application/json",
        schema: errorCodeSchema,
      },
    },
    auth: "anonymous",
    risk: "read-only",
    verificationStatus: "verified-anonymous",
    sources: ["legacy-openapi", "live-probe"],
    description:
      "返回当前访问者可见的首页 Banner。服务端根据启用状态、过期时间和登录状态筛选配置项。",
  },
  {
    method: "GET",
    path: "/config/global/advertisement/all",
    operationId: "getConfigGlobalAdvertisementAll",
    summary: "获取全部首页 Banner 配置",
    tags: ["Config", "Index", "Moderation"],
    parameters: [],
    responses: {
      "200": {
        description: "成功获取全部首页 Banner 配置",
        contentType: "application/json",
        schema: z.array(indexColumnSchema),
      },
      default: {
        description: "API 错误码",
        contentType: "application/json",
        schema: errorCodeSchema,
      },
    },
    auth: "required",
    risk: "read-only",
    verificationStatus: "permission-denied",
    sources: ["legacy-openapi", "live-probe"],
    description:
      "供站点管理页面读取全部首页 Banner 配置，包括已停用、过期或仅对特定登录状态可见的记录。",
  },
  {
    method: "GET",
    path: "/config/global/special-offer/all",
    operationId: "getConfigGlobalSpecialOfferAll",
    summary: "获取全部福利优惠配置",
    tags: ["Config", "Index", "Moderation"],
    parameters: [],
    responses: {
      "200": {
        description: "成功获取全部福利优惠配置",
        contentType: "application/json",
        schema: z.array(indexColumnSchema),
      },
      default: {
        description: "API 错误码",
        contentType: "application/json",
        schema: errorCodeSchema,
      },
    },
    auth: "required",
    risk: "read-only",
    verificationStatus: "permission-denied",
    sources: ["legacy-openapi", "live-probe"],
    description:
      "供站点管理页面读取全部福利优惠配置，包括已停用、过期或仅对特定登录状态可见的记录。",
  },
  {
    method: "GET",
    path: "/config/global/alltag",
    operationId: "getConfigGlobalAlltag",
    summary: "获取全部全局标签",
    tags: ["Config"],
    parameters: [],
    responses: {
      "200": {
        description: "成功获取全局标签 ID 与名称列表",
        contentType: "application/json",
        schema: z.array(tagSchema),
      },
      default: {
        description: "API 错误码",
        contentType: "application/json",
        schema: errorCodeSchema,
      },
    },
    auth: "anonymous",
    risk: "read-only",
    verificationStatus: "verified-anonymous",
    sources: ["legacy-openapi", "live-probe"],
    description: "返回主题分类和筛选使用的全局标签字典。",
  },
  {
    method: "GET",
    path: "/config/now",
    operationId: "getConfigNow",
    summary: "获取服务器时间",
    tags: ["Config"],
    parameters: [],
    responses: {
      "200": {
        description: "成功获取服务器当前时间",
        contentType: "application/json",
        schema: serverTimeResponseSchema,
      },
      default: {
        description: "API 错误码",
        contentType: "application/json",
        schema: errorCodeSchema,
      },
    },
    auth: "anonymous",
    risk: "read-only",
    verificationStatus: "verified-anonymous",
    sources: ["legacy-openapi", "live-probe"],
    description:
      "返回论坛服务器当前时间。签到和补签页面使用该时间确定当前日期，避免客户端时钟或时区差异影响月份和日期判断。",
  },
  {
    method: "GET",
    path: "/config/index",
    operationId: "getConfigIndex",
    summary: "获取首页聚合数据",
    tags: ["Index"],
    parameters: [],
    responses: {
      "200": {
        description: "首页公告、热门主题、运营栏目、分类主题和论坛统计",
        contentType: "application/json",
        schema: indexSchema,
      },
      default: {
        description: "API 错误码",
        contentType: "application/json",
        schema: errorCodeSchema,
      },
    },
    auth: "anonymous",
    risk: "read-only",
    verificationStatus: "verified-anonymous",
    sources: ["legacy-openapi", "live-probe"],
    description:
      "返回论坛首页一次展示所需的聚合数据，包括公告、自动和人工热门主题、推荐栏目、分类主题及全站统计。后端可能省略暂时没有内容的栏目。",
  },
  {
    method: "PUT",
    path: "/config/index/update",
    operationId: "putConfigIndexUpdate",
    summary: "刷新首页聚合缓存",
    tags: ["Index", "Moderation"],
    parameters: [],
    responses: {
      "200": { description: "首页聚合缓存刷新请求已处理" },
      default: {
        description: "API 错误码",
        contentType: "application/json",
        schema: errorCodeSchema,
      },
    },
    auth: "required",
    risk: "destructive",
    verificationStatus: "unknown",
    sources: ["legacy-openapi", "live-probe"],
    description:
      "清除并刷新首页聚合数据缓存，使公告和首页栏目等配置更新尽快生效。需要站点管理权限。",
  },
  {
    method: "GET",
    path: "/index/column/{columnKind}/all",
    operationId: "getIndexColumnColumnKindAll",
    summary: "获取首页栏目全部配置",
    tags: ["Index", "Moderation"],
    parameters: [
      {
        name: "columnKind",
        in: "path",
        required: true,
        schema: z.union([
          z.literal("recommandationreading"),
          z.literal("recommandationfunction"),
          z.literal("schoolnews"),
        ]),
        description:
          "栏目类型：recommandationreading 为推荐阅读，recommandationfunction 为推荐功能，schoolnews 为校园新闻。",
        probeValue: "recommandationreading",
      },
    ],
    responses: {
      "200": {
        description: "指定首页栏目的全部配置项",
        contentType: "application/json",
        schema: z.array(indexColumnSchema),
      },
      default: {
        description: "API 错误码",
        contentType: "application/json",
        schema: errorCodeSchema,
      },
    },
    auth: "required",
    risk: "read-only",
    verificationStatus: "unknown",
    sources: ["legacy-openapi", "live-probe"],
    description: "供站点管理页面读取指定首页栏目的全部配置，包括当前未启用的项目。",
  },
  {
    method: "POST",
    path: "/index/column/",
    operationId: "postIndexColumn",
    summary: "创建首页栏目配置项",
    tags: ["Index", "Moderation"],
    parameters: [],
    requestBody: { required: true, contentType: "application/json", schema: indexColumnSchema },
    responses: {
      "200": { description: "首页栏目配置项创建请求已处理" },
      default: {
        description: "API 错误码",
        contentType: "application/json",
        schema: errorCodeSchema,
      },
    },
    auth: "required",
    risk: "destructive",
    verificationStatus: "unknown",
    sources: ["legacy-openapi", "live-probe"],
    description:
      "创建推荐阅读、推荐功能、校园新闻、Banner 或福利优惠等首页栏目配置项。需要站点管理权限。",
  },
  {
    method: "PUT",
    path: "/index/column/{id}",
    operationId: "putIndexColumnId",
    summary: "修改首页栏目配置项",
    tags: ["Index", "Moderation"],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: z.number().int().positive(),
        description: "需要修改的首页栏目配置项 ID。",
        probeValue: 758,
      },
    ],
    requestBody: { required: true, contentType: "application/json", schema: indexColumnSchema },
    responses: {
      "200": { description: "首页栏目配置项修改请求已处理" },
      default: {
        description: "API 错误码",
        contentType: "application/json",
        schema: errorCodeSchema,
      },
    },
    auth: "required",
    risk: "destructive",
    verificationStatus: "unknown",
    sources: ["legacy-openapi", "live-probe"],
    description:
      "修改指定首页栏目配置项的内容、链接、图片、排序、有效期、启用状态或可见范围。需要站点管理权限。",
  },
  {
    method: "GET",
    path: "/config/global/all-user-title",
    operationId: "getConfigGlobalAllUserTitle",
    summary: "获取全部用户头衔",
    tags: ["Config", "User"],
    parameters: [],
    responses: {
      "200": {
        description: "成功获取全部用户头衔定义",
        contentType: "application/json",
        schema: z.array(displayTitleSchema),
      },
      default: {
        description: "API 错误码",
        contentType: "application/json",
        schema: errorCodeSchema,
      },
    },
    auth: "anonymous",
    risk: "read-only",
    verificationStatus: "verified-anonymous",
    sources: ["legacy-openapi", "live-probe"],
    description: "返回用户头衔定义，用于匹配用户资料中的 displayTitleId 和 userTitleIds。",
  },
]);
