import { z } from "zod";

export const passwordTokenRequestSchema = z
  .object({
    client_id: z.string(),
    client_secret: z.string(),
    grant_type: z.literal("password"),
    username: z.string(),
    password: z.string(),
    scope: z.string(),
  })
  .meta({ id: "PasswordTokenRequest" });
export type PasswordTokenRequest = z.infer<typeof passwordTokenRequestSchema>;

export const refreshTokenRequestSchema = z
  .object({
    client_id: z.string(),
    client_secret: z.string(),
    grant_type: z.literal("refresh_token"),
    refresh_token: z.string(),
  })
  .meta({ id: "RefreshTokenRequest" });
export type RefreshTokenRequest = z.infer<typeof refreshTokenRequestSchema>;

export const tokenRequestSchema = z
  .discriminatedUnion("grant_type", [passwordTokenRequestSchema, refreshTokenRequestSchema])
  .meta({ id: "TokenRequest" });
export type TokenRequest = z.infer<typeof tokenRequestSchema>;

export const tokenFormRequestSchema = z
  .object({
    client_id: z.string(),
    client_secret: z.string(),
    grant_type: z.enum(["password", "refresh_token"]),
    username: z.string().optional(),
    password: z.string().optional(),
    scope: z.string().optional(),
    refresh_token: z.string().optional(),
  })
  .meta({
    id: "TokenFormRequest",
    description:
      "OpenAPI 表单描述。密码登录填写 username、password、scope；刷新登录填写 refresh_token。",
  });

export const tokenResponseSchema = z
  .looseObject({
    access_token: z.string(),
    expires_in: z.number(),
    refresh_token: z.string(),
    token_type: z.string(),
  })
  .meta({ id: "TokenResponse" });
export type TokenResponse = z.infer<typeof tokenResponseSchema>;
