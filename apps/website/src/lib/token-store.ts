const AUTH_STORAGE_KEY = "cc98:auth";
const REFRESH_TOKEN_TTL_MS = 2592000 * 1000;

export interface AuthData {
  accessToken: string;
  accessTokenExpiresAt: number;
  refreshToken: string;
  refreshTokenExpiresAt: number;
}

interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function createAuthData(resp: {
  access_token: string;
  expires_in: number;
  refresh_token: string;
}): AuthData {
  const now = Date.now();
  return {
    accessToken: resp.access_token,
    accessTokenExpiresAt: now + resp.expires_in * 1000,
    refreshToken: resp.refresh_token,
    refreshTokenExpiresAt: now + REFRESH_TOKEN_TTL_MS,
  };
}

export interface TokenStore {
  getAccessToken(): string | null;
  getRefreshToken(): string | null;
  hasValidAuth(): boolean;
  save(data: AuthData): void;
  clear(): void;
  onCleared(cb: () => void): () => void;
}

function createTokenStore(adapter: StorageAdapter | undefined): TokenStore {
  const clearedCallbacks = new Set<() => void>();

  function load(): AuthData | null {
    if (!adapter) return null;
    try {
      const raw = adapter.getItem(AUTH_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as AuthData;
    } catch {
      return null;
    }
  }

  return {
    getAccessToken() {
      const data = load();
      if (!data || data.accessTokenExpiresAt <= Date.now()) return null;
      return data.accessToken;
    },
    getRefreshToken() {
      const data = load();
      if (!data || data.refreshTokenExpiresAt <= Date.now()) return null;
      return data.refreshToken;
    },
    hasValidAuth() {
      return this.getRefreshToken() !== null;
    },
    save(data: AuthData) {
      if (!adapter) return;
      try {
        adapter.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
      } catch {
        // 存储不可用时静默降级
      }
    },
    clear() {
      if (adapter) {
        try {
          adapter.removeItem(AUTH_STORAGE_KEY);
        } catch {
          // 同上
        }
      }
      for (const cb of clearedCallbacks) {
        try {
          cb();
        } catch {
          // 单个回调异常不影响其余
        }
      }
    },
    onCleared(cb: () => void) {
      clearedCallbacks.add(cb);
      return () => {
        clearedCallbacks.delete(cb);
      };
    },
  };
}

const defaultAdapter: StorageAdapter | undefined =
  typeof localStorage !== "undefined" ? localStorage : undefined;

export const tokenStore: TokenStore = createTokenStore(defaultAdapter);
