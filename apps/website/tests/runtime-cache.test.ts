import { describe, expect, test } from "vite-plus/test";
import { createAppAssetCachePlugin } from "../build/runtime-cache.ts";

const plugin = createAppAssetCachePlugin();

async function cacheable(url: string, contentType: string, status = 200): Promise<boolean> {
  const response = new Response("content", {
    headers: { "Content-Type": contentType },
    status,
  });
  return (await plugin.cacheWillUpdate({ request: new Request(url), response })) === response;
}

async function reusable(url: string, contentType: string, status = 200): Promise<boolean> {
  const cachedResponse = new Response("content", {
    headers: { "Content-Type": contentType },
    status,
  });
  return (
    (await plugin.cachedResponseWillBeUsed({
      request: new Request(url),
      cachedResponse,
    })) === cachedResponse
  );
}

describe("应用资源运行时缓存", () => {
  test("只缓存类型正确的脚本和样式", async () => {
    await expect(
      cacheable("https://example.com/assets/page-123.js", "application/javascript"),
    ).resolves.toBe(true);
    await expect(cacheable("https://example.com/assets/page-123.js", "text/html")).resolves.toBe(
      false,
    );
    await expect(
      cacheable("https://example.com/assets/page-123.css", "text/css; charset=utf-8"),
    ).resolves.toBe(true);
  });

  test("拒绝错误响应并接受常见字体类型", async () => {
    await expect(
      cacheable("https://example.com/assets/page-123.js", "application/javascript", 404),
    ).resolves.toBe(false);
    await expect(
      cacheable("https://example.com/assets/font-123.woff2", "font/woff2"),
    ).resolves.toBe(true);
    await expect(
      cacheable("https://example.com/assets/font-123.ttf", "application/octet-stream"),
    ).resolves.toBe(true);
  });

  test("复用类型正确的脚本和样式缓存", async () => {
    await expect(
      reusable("https://example.com/assets/page-123.js", "application/javascript"),
    ).resolves.toBe(true);
    await expect(
      reusable("https://example.com/assets/page-123.css", "text/css; charset=utf-8"),
    ).resolves.toBe(true);
  });

  test("拒绝被 HTML 污染的缓存响应", async () => {
    await expect(reusable("https://example.com/assets/page-123.js", "text/html")).resolves.toBe(
      false,
    );
  });

  test("拒绝错误状态的缓存响应", async () => {
    await expect(
      reusable("https://example.com/assets/page-123.js", "application/javascript", 404),
    ).resolves.toBe(false);
  });
});
