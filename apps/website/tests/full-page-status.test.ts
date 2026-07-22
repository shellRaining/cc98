import { describe, expect, test } from "vite-plus/test";
import { FULL_PAGE_STATUS_CONFIG } from "../src/components/full-page-status.ts";

describe("完整错误页配置", () => {
  test("四类状态插图进入构建依赖图", () => {
    const statusImages = [
      FULL_PAGE_STATUS_CONFIG.unauthorized.image,
      FULL_PAGE_STATUS_CONFIG.forbidden.image,
      FULL_PAGE_STATUS_CONFIG["not-found"].image,
      FULL_PAGE_STATUS_CONFIG.server.image,
    ];
    expect(statusImages.every(Boolean)).toBe(true);
    expect(new Set(statusImages).size).toBe(4);
    expect(statusImages.every((image) => !image.startsWith("/static/images/"))).toBe(true);
    expect(FULL_PAGE_STATUS_CONFIG.network.image).toBe(FULL_PAGE_STATUS_CONFIG.server.image);
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
