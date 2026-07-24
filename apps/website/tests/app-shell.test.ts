import type { Rollup } from "vite";
import { describe, expect, it } from "vite-plus/test";
import { collectAppShellEntries } from "../build/app-shell.js";

function chunk(
  fileName: string,
  options: {
    facadeModuleId?: string;
    imports?: string[];
    css?: string[];
    assets?: string[];
    isEntry?: boolean;
    isDynamicEntry?: boolean;
  } = {},
): Rollup.OutputChunk {
  return {
    type: "chunk",
    fileName,
    facadeModuleId: options.facadeModuleId ?? null,
    imports: options.imports ?? [],
    dynamicImports: [],
    isEntry: options.isEntry ?? false,
    isDynamicEntry: options.isDynamicEntry ?? false,
    viteMetadata: {
      importedCss: new Set(options.css),
      importedAssets: new Set(options.assets),
    },
  } as unknown as Rollup.OutputChunk;
}

describe("应用外壳构建清单", () => {
  it("收集入口和首页的静态闭包，排除其他路由和入口图片注册表", () => {
    const bundle = {
      "assets/index.js": chunk("assets/index.js", {
        facadeModuleId: "/repo/apps/website/index.html",
        imports: ["assets/shared.js"],
        css: ["assets/index.css"],
        assets: ["assets/all-themes.jpg"],
        isEntry: true,
      }),
      "assets/shared.js": chunk("assets/shared.js", {
        css: ["assets/shared.css"],
      }),
      "assets/HomeView.js": chunk("assets/HomeView.js", {
        facadeModuleId: "/repo/apps/website/src/views/HomeView.vue",
        imports: ["assets/shared.js"],
        css: ["assets/HomeView.css"],
        assets: ["assets/forum-stats-mascot.webp"],
        isDynamicEntry: true,
      }),
      "assets/TopicView.js": chunk("assets/TopicView.js", {
        facadeModuleId: "/repo/apps/website/src/views/topic/TopicView.vue",
        isDynamicEntry: true,
      }),
    } as unknown as Rollup.OutputBundle;

    expect(collectAppShellEntries(bundle)).toEqual([
      "assets/HomeView.css",
      "assets/HomeView.js",
      "assets/forum-stats-mascot.webp",
      "assets/index.css",
      "assets/index.js",
      "assets/shared.css",
      "assets/shared.js",
    ]);
  });

  it("缺少首页动态入口时阻止构建", () => {
    const bundle = {
      "assets/index.js": chunk("assets/index.js", {
        facadeModuleId: "/repo/apps/website/index.html",
        isEntry: true,
      }),
    } as unknown as Rollup.OutputBundle;

    expect(() => collectAppShellEntries(bundle)).toThrow("没有在构建产物中找到首页路由 chunk");
  });
});
