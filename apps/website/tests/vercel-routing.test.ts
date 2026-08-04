import { readFileSync } from "node:fs";
import { describe, expect, test } from "vite-plus/test";

interface VercelConfig {
  rewrites: Array<{ source: string; destination: string }>;
}

const config = JSON.parse(
  readFileSync(new URL("../../../vercel.json", import.meta.url), "utf8"),
) as VercelConfig;
const spaRewrite = config.rewrites.find((rewrite) => rewrite.destination === "/index.html");

function matchesSpaRewrite(path: string): boolean {
  if (!spaRewrite) return false;
  return new RegExp(`^${spaRewrite.source}$`).test(path);
}

describe("Vercel SPA 回退", () => {
  test("业务路由回退到首页", () => {
    expect(matchesSpaRewrite("/topic/123")).toBe(true);
    expect(matchesSpaRewrite("/user/name/user.with.dot")).toBe(true);
  });

  test("静态资源和 PWA 文件不参与首页回退", () => {
    expect(matchesSpaRewrite("/assets/TopicView-old.js")).toBe(false);
    expect(matchesSpaRewrite("/sw.js")).toBe(false);
    expect(matchesSpaRewrite("/manifest.webmanifest")).toBe(false);
    expect(matchesSpaRewrite("/pwa-192x192.png")).toBe(false);
    expect(matchesSpaRewrite("/apple-touch-icon.png")).toBe(false);
    expect(matchesSpaRewrite("/favicon.ico")).toBe(false);
  });
});
