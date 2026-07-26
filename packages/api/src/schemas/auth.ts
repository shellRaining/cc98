import { z } from "zod";

export const passwordTokenRequestSchema = z
  .object({
    client_id: z.string().min(1).meta({ description: "OpenID 客户端 ID。" }),
    client_secret: z
      .string()
      .min(1)
      .meta({ description: "OpenID 客户端密钥。", format: "password", writeOnly: true }),
    grant_type: z
      .literal("password")
      .meta({ description: "授权模式，密码登录时固定为 password。" }),
    username: z.string().min(1).meta({ description: "CC98 用户名。" }),
    password: z
      .string()
      .min(1)
      .meta({ description: "CC98 账号密码。", format: "password", writeOnly: true }),
    scope: z.string().min(1).meta({ description: "请求的授权范围，多个 scope 使用空格分隔。" }),
  })
  .meta({ id: "PasswordTokenRequest", description: "使用用户名和密码申请 Token 的表单。" });
export type PasswordTokenRequest = z.infer<typeof passwordTokenRequestSchema>;

export const refreshTokenRequestSchema = z
  .object({
    client_id: z.string().min(1).meta({ description: "OpenID 客户端 ID。" }),
    client_secret: z
      .string()
      .min(1)
      .meta({ description: "OpenID 客户端密钥。", format: "password", writeOnly: true }),
    grant_type: z
      .literal("refresh_token")
      .meta({ description: "授权模式，刷新 Token 时固定为 refresh_token。" }),
    refresh_token: z.string().min(1).meta({
      description: "上一次授权获得的 Refresh Token。",
      format: "password",
      writeOnly: true,
    }),
  })
  .meta({ id: "RefreshTokenRequest", description: "使用 Refresh Token 换取新 Token 的表单。" });
export type RefreshTokenRequest = z.infer<typeof refreshTokenRequestSchema>;

export const tokenRequestSchema = z
  .discriminatedUnion("grant_type", [passwordTokenRequestSchema, refreshTokenRequestSchema])
  .meta({ id: "TokenRequest", description: "OpenID Token 请求；由 grant_type 决定表单结构。" });
export type TokenRequest = z.infer<typeof tokenRequestSchema>;

export const tokenResponseSchema = z
  .looseObject({
    access_token: z.string().meta({ description: "访问 CC98 API 时使用的 Access Token。" }),
    expires_in: z
      .number()
      .int()
      .nonnegative()
      .meta({ description: "Access Token 的有效期，单位为秒。" }),
    refresh_token: z.string().meta({ description: "用于换取新 Token 的 Refresh Token。" }),
    token_type: z.string().meta({ description: "Token 类型，当前返回 Bearer。" }),
    scope: z.string().optional().meta({ description: "服务端实际授予的授权范围。" }),
    id_token: z
      .string()
      .optional()
      .meta({ description: "OpenID Connect 身份令牌；刷新 Token 时可能返回。" }),
  })
  .meta({ id: "TokenResponse", description: "OpenID 服务签发的 Token。" });
export type TokenResponse = z.infer<typeof tokenResponseSchema>;

export const tokenErrorResponseSchema = z
  .looseObject({
    error: z.string().meta({ description: "OAuth 2.0 错误代码。" }),
    error_description: z.string().optional().meta({ description: "可读的错误原因说明。" }),
    error_uri: z.string().optional().meta({ description: "错误说明文档地址。" }),
  })
  .meta({ id: "TokenErrorResponse", description: "OpenID Token 请求失败时的 OAuth 错误。" });
export type TokenErrorResponse = z.infer<typeof tokenErrorResponseSchema>;
