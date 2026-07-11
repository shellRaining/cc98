import {
  passwordTokenRequestSchema,
  refreshTokenRequestSchema,
  tokenResponseSchema,
  type TokenResponse,
} from "@cc98/api";

const CONNECT_TOKEN_URL = "https://openid.cc98.org/connect/token";
const OAUTH_SCOPE = "cc98-api openid offline_access";

const DEFAULT_CLIENT_ID = "9a1fd200-8687-44b1-4c20-08d50a96e5cd";
const DEFAULT_CLIENT_SECRET = "8b53f727-08e2-4509-8857-e34bf92b27f2";

const clientId = import.meta.env.VITE_OAUTH_CLIENT_ID ?? DEFAULT_CLIENT_ID;
const clientSecret = import.meta.env.VITE_OAUTH_CLIENT_SECRET ?? DEFAULT_CLIENT_SECRET;

export type { TokenResponse } from "@cc98/api";

function buildPasswordBody(username: string, password: string): URLSearchParams {
  return new URLSearchParams(
    passwordTokenRequestSchema.parse({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "password",
      username,
      password,
      scope: OAUTH_SCOPE,
    }),
  );
}

function buildRefreshBody(refreshToken: string): URLSearchParams {
  return new URLSearchParams(
    refreshTokenRequestSchema.parse({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  );
}

async function postToken(body: URLSearchParams): Promise<TokenResponse> {
  const response = await fetch(CONNECT_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!response.ok) {
    throw new Error(`OAuth token 请求失败：${response.status}`);
  }
  const json: unknown = await response.json();
  return tokenResponseSchema.parse(json);
}

export function requestPasswordToken(username: string, password: string): Promise<TokenResponse> {
  return postToken(buildPasswordBody(username, password));
}

export function requestRefreshToken(refreshToken: string): Promise<TokenResponse> {
  return postToken(buildRefreshBody(refreshToken));
}
