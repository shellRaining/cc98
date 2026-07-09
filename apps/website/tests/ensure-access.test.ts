import { expect, test, describe, vi } from "vite-plus/test";
import { createEnsureValidAccessToken } from "../src/lib/auth.ts";

interface FakeTokenStore {
  load: ReturnType<typeof vi.fn>;
  save: ReturnType<typeof vi.fn>;
  clear: ReturnType<typeof vi.fn>;
  getAccessToken: ReturnType<typeof vi.fn>;
  getRefreshToken: ReturnType<typeof vi.fn>;
  hasValidAuth: ReturnType<typeof vi.fn>;
  onCleared: ReturnType<typeof vi.fn>;
}

function makeFakeTokenStore(overrides: Partial<FakeTokenStore> = {}): FakeTokenStore {
  return {
    load: vi.fn().mockReturnValue(null),
    save: vi.fn(),
    clear: vi.fn(),
    getAccessToken: vi.fn().mockReturnValue(null),
    getRefreshToken: vi.fn().mockReturnValue(null),
    hasValidAuth: vi.fn().mockReturnValue(false),
    onCleared: vi.fn().mockReturnValue(() => {}),
    ...overrides,
  };
}

const REFRESH_RESPONSE = {
  access_token: "new-access",
  expires_in: 3600,
  refresh_token: "new-refresh",
  token_type: "Bearer",
};

describe("ensureValidAccessToken - access 未过期", () => {
  test("直接返回 access 且不刷新", async () => {
    const tokenStore = makeFakeTokenStore({
      getAccessToken: vi.fn().mockReturnValue("access-1"),
    });
    const requestRefreshToken = vi.fn();
    const ensure = createEnsureValidAccessToken({ tokenStore, requestRefreshToken });

    await expect(ensure()).resolves.toBe("access-1");
    expect(requestRefreshToken).not.toHaveBeenCalled();
  });
});

describe("ensureValidAccessToken - access 过期 + refresh 有效", () => {
  test("刷新成功后 save 新数据并返回新 access", async () => {
    const tokenStore = makeFakeTokenStore({
      getAccessToken: vi.fn().mockReturnValue(null),
      getRefreshToken: vi.fn().mockReturnValue("refresh-1"),
      save: vi.fn(),
    });
    const requestRefreshToken = vi.fn().mockResolvedValue(REFRESH_RESPONSE);
    const ensure = createEnsureValidAccessToken({ tokenStore, requestRefreshToken });

    await expect(ensure()).resolves.toBe("new-access");
    expect(requestRefreshToken).toHaveBeenCalledWith("refresh-1");
    expect(requestRefreshToken).toHaveBeenCalledOnce();
    expect(tokenStore.save).toHaveBeenCalledOnce();
    const saved = tokenStore.save.mock.calls[0][0];
    expect(saved.accessToken).toBe("new-access");
    expect(saved.refreshToken).toBe("new-refresh");
  });
});

describe("ensureValidAccessToken - access 过期 + refresh 也过期", () => {
  test("返回 null 且不刷新", async () => {
    const tokenStore = makeFakeTokenStore({
      getAccessToken: vi.fn().mockReturnValue(null),
      getRefreshToken: vi.fn().mockReturnValue(null),
    });
    const requestRefreshToken = vi.fn();
    const ensure = createEnsureValidAccessToken({ tokenStore, requestRefreshToken });

    await expect(ensure()).resolves.toBe(null);
    expect(requestRefreshToken).not.toHaveBeenCalled();
  });
});

describe("ensureValidAccessToken - 刷新抛错", () => {
  test("调用 clear 并返回 null", async () => {
    const tokenStore = makeFakeTokenStore({
      getAccessToken: vi.fn().mockReturnValue(null),
      getRefreshToken: vi.fn().mockReturnValue("refresh-1"),
      clear: vi.fn(),
    });
    const requestRefreshToken = vi.fn().mockRejectedValue(new Error("401"));
    const ensure = createEnsureValidAccessToken({ tokenStore, requestRefreshToken });

    await expect(ensure()).resolves.toBe(null);
    expect(requestRefreshToken).toHaveBeenCalledWith("refresh-1");
    expect(tokenStore.clear).toHaveBeenCalledOnce();
  });
});

describe("ensureValidAccessToken - 并发去重", () => {
  test("同时 3 次调用只刷新 1 次且返回同一 access", async () => {
    const tokenStore = makeFakeTokenStore({
      getAccessToken: vi.fn().mockReturnValue(null),
      getRefreshToken: vi.fn().mockReturnValue("refresh-1"),
      save: vi.fn(),
    });
    let resolveRefresh!: (v: unknown) => void;
    const pending = new Promise((r) => {
      resolveRefresh = r;
    });
    const requestRefreshToken = vi.fn().mockReturnValue(pending);
    const ensure = createEnsureValidAccessToken({ tokenStore, requestRefreshToken });

    const p1 = ensure();
    const p2 = ensure();
    const p3 = ensure();

    expect(requestRefreshToken).toHaveBeenCalledOnce();
    resolveRefresh(REFRESH_RESPONSE);

    await expect(p1).resolves.toBe("new-access");
    await expect(p2).resolves.toBe("new-access");
    await expect(p3).resolves.toBe("new-access");
  });
});

describe("ensureValidAccessToken - 刷新成功后再次调用", () => {
  test("直接返回缓存 access 不再刷新", async () => {
    const tokenStore = makeFakeTokenStore({
      getAccessToken: vi.fn().mockReturnValueOnce(null).mockReturnValue("new-access"),
      getRefreshToken: vi.fn().mockReturnValue("refresh-1"),
      save: vi.fn(),
    });
    const requestRefreshToken = vi.fn().mockResolvedValue(REFRESH_RESPONSE);
    const ensure = createEnsureValidAccessToken({ tokenStore, requestRefreshToken });

    await ensure();
    await expect(ensure()).resolves.toBe("new-access");
    expect(requestRefreshToken).toHaveBeenCalledOnce();
  });
});
