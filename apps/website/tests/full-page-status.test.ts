import { describe, expect, test } from "vite-plus/test";
import { FULL_PAGE_STATUS_CONFIG } from "../src/lib/full-page-status.ts";

describe("完整错误页配置", () => {
  test("保留旧站四类状态插图", () => {
    expect(FULL_PAGE_STATUS_CONFIG.unauthorized.image).toBe("/static/images/401.webp");
    expect(FULL_PAGE_STATUS_CONFIG.forbidden.image).toBe("/static/images/403.webp");
    expect(FULL_PAGE_STATUS_CONFIG["not-found"].image).toBe("/static/images/404.webp");
    expect(FULL_PAGE_STATUS_CONFIG.server.image).toBe("/static/images/500.webp");
  });

  test("需要恢复的状态提供登录或重试入口", () => {
    expect(FULL_PAGE_STATUS_CONFIG.unauthorized.showLogin).toBe(true);
    expect(FULL_PAGE_STATUS_CONFIG.unauthorized.showHome).toBe(false);
    expect(FULL_PAGE_STATUS_CONFIG.unauthorized.documentTitle).toBe("您未登录");
    expect(FULL_PAGE_STATUS_CONFIG.unauthorized.message).toBe("您当前未登录");
    expect(FULL_PAGE_STATUS_CONFIG.server.showRetry).toBe(true);
    expect(FULL_PAGE_STATUS_CONFIG.maintenance.showRetry).toBe(true);
    expect(FULL_PAGE_STATUS_CONFIG.network.showRetry).toBe(true);
  });
});
