import { tokenStore, createAuthData, type TokenStore, type AuthData } from "./token-store";
import { requestPasswordToken, requestRefreshToken, type TokenResponse } from "./oauth";
import { createLogger } from "./logger";

const authLogger = createLogger("auth");

export type { AuthData } from "./token-store";

export interface EnsureDeps {
  tokenStore: TokenStore;
  requestRefreshToken: (refreshToken: string) => Promise<TokenResponse>;
}

export function createEnsureValidAccessToken(deps: EnsureDeps): () => Promise<string | null> {
  let inflight: Promise<string | null> | null = null;

  async function resolve(): Promise<string | null> {
    const access = deps.tokenStore.getAccessToken();
    if (access) return access;

    const refresh = deps.tokenStore.getRefreshToken();
    if (!refresh) return null;

    const resp = await deps.requestRefreshToken(refresh);
    const data: AuthData = createAuthData(resp);
    deps.tokenStore.save(data);
    return data.accessToken;
  }

  return function ensureValidAccessToken(): Promise<string | null> {
    if (inflight) return inflight;
    const promise = resolve().catch((err: unknown) => {
      deps.tokenStore.clear();
      authLogger.warn({ err }, "access token 刷新失败，已清理登录态");
      return null;
    });
    inflight = promise;
    void promise.finally(() => {
      inflight = null;
    });
    return promise;
  };
}

export const ensureValidAccessToken = createEnsureValidAccessToken({
  tokenStore,
  requestRefreshToken,
});

export async function loginWithPassword(username: string, password: string): Promise<AuthData> {
  const resp = await requestPasswordToken(username, password);
  const data = createAuthData(resp);
  tokenStore.save(data);
  return data;
}

export function clearAuth(): void {
  tokenStore.clear();
}

export function hasValidAuth(): boolean {
  return tokenStore.hasValidAuth();
}

export function onAuthLost(cb: () => void): () => void {
  return tokenStore.onCleared(cb);
}
