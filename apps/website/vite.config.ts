import { defineConfig } from "vite-plus";
import vue from "@vitejs/plugin-vue";
import UnoCSS from "unocss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { appShellPlugin } from "./build/app-shell.js";

const pwaPlugins = VitePWA({
  injectRegister: "auto",
  registerType: "prompt",
  includeManifestIcons: false,
  manifest: {
    id: "/",
    name: "CC98 论坛",
    short_name: "CC98",
    description: "浙江大学 CC98 论坛",
    lang: "zh-CN",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#e6e7ec",
    theme_color: "#5198d8",
    icons: [
      {
        src: "/pwa-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/pwa-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/pwa-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  },
  workbox: {
    cleanupOutdatedCaches: true,
    globPatterns: ["index.html", "assets/logo-*.ico"],
    inlineWorkboxRuntime: true,
    navigateFallback: "index.html",
    runtimeCaching: [
      {
        urlPattern: /\/assets\/[^?]+\.(?:js|css|woff2?|ttf)$/,
        handler: "NetworkFirst",
        options: {
          cacheName: "app-assets-v1",
          cacheableResponse: { statuses: [200] },
          networkTimeoutSeconds: 3,
          expiration: {
            maxEntries: 160,
            purgeOnQuotaError: true,
          },
        },
      },
      {
        urlPattern: /\/assets\/banner(?!-card(?:-dark)?-)(?:-dark)?-[^/]+\.jpg$/,
        handler: "CacheFirst",
        options: {
          cacheName: "skin-images-v1",
          cacheableResponse: {
            headers: {
              "Content-Type": "image/jpeg",
            },
            statuses: [200],
          },
          expiration: {
            maxEntries: 12,
            purgeOnQuotaError: true,
          },
        },
      },
      {
        urlPattern: /\/assets\/forum-stats-mascot-[^/]+\.webp$/,
        handler: "CacheFirst",
        options: {
          cacheName: "skin-mascots-v1",
          cacheableResponse: {
            headers: {
              "Content-Type": "image/webp",
            },
            statuses: [200],
          },
          expiration: {
            maxEntries: 12,
            purgeOnQuotaError: true,
          },
        },
      },
    ],
  },
});

export default defineConfig({
  logLevel: "warn",
  plugins: [UnoCSS(), vue(), ...pwaPlugins, appShellPlugin(pwaPlugins)],
  build: {
    // hls.js 只在播放 HLS 视频时按需加载，超过此大小的 chunk 仍会触发告警。
    chunkSizeWarningLimit: 520,
    reportCompressedSize: false,
  },
  server: {
    port: 5173,
  },
});
