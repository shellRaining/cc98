import { defineConfig } from "vite-plus";
import vue from "@vitejs/plugin-vue";
import UnoCSS from "unocss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  logLevel: "warn",
  plugins: [
    UnoCSS(),
    vue(),
    VitePWA({
      manifest: false,
      injectRegister: "script-defer",
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: [
          "index.html",
          "favicon.ico",
          "registerSW.js",
          "assets/index-*.js",
          "assets/index-*.css",
          "assets/rolldown-runtime-*.js",
          "assets/_plugin-vue_export-helper-*.js",
          "assets/HomeView-*.js",
          "assets/HomeView-*.css",
          "assets/HomeSectionHeader-*.js",
          "assets/HomeSectionHeader-*.css",
          "assets/model-*.js",
          "assets/PageState-*.js",
          "assets/api-error-*.js",
          "assets/logo-*.ico",
        ],
        inlineWorkboxRuntime: true,
        navigateFallback: "index.html",
        runtimeCaching: [
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
        ],
      },
    }),
  ],
  build: {
    // hls.js 只在播放 HLS 视频时按需加载，超过此大小的 chunk 仍会触发告警。
    chunkSizeWarningLimit: 520,
    reportCompressedSize: false,
  },
  server: {
    port: 5173,
  },
});
