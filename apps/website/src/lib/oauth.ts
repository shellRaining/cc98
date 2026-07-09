import { z } from "zod";

const CONNECT_TOKEN_URL = "https://openid.cc98.org/connect/token";
const OAUTH_SCOPE = "cc98-api openid offline_access";

const DEFAULT_CLIENT_ID = "9a1fd200-8687-44b1-4c20-08d50a96e5cd";
const DEFAULT_CLIENT_SECRET = "8b53f727-08e2-4509-8857-e34bf92b27f2";

const clientId = import.meta.env.VITE_OAUTH_CLIENT_ID ?? DEFAULT_CLIENT_ID;
const clientSecret = import.meta.env.VITE_OAUTH_CLIENT_SECRET ?? DEFAULT_CLIENT_SECRET;

const tokenResponseSchema = z.object({
  access_token: z.string(),
  expires_in: z.number(),
  refresh_token: z.string(),
  token_type: z.string(),
});

export type TokenResponse = z.infer<typeof tokenResponseSchema>;

function buildPasswordBody(username: string, password: string): URLSearchParams {
  const params = new URLSearchParams();
  params.set("client_id", clientId);
  params.set("client_secret", clientSecret);
  params.set("grant_type", "password");
  params.set("username", username);
  params.set("password", password);
  params.set("scope", OAUTH_SCOPE);
  return params;
}

function buildRefreshBody(refreshToken: string): URLSearchParams {
  const params = new URLSearchParams();
  params.set("client_id", clientId);
  params.set("client_secret", clientSecret);
  params.set("grant_type", "refresh_token");
  params.set("refresh_token", refreshToken);
  return params;
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
