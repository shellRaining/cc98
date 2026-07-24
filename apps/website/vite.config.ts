import { defineConfig } from "vite-plus";
import vue from "@vitejs/plugin-vue";
import UnoCSS from "unocss/vite";

export default defineConfig({
  logLevel: "warn",
  plugins: [UnoCSS(), vue()],
  build: {
    // hls.js 只在播放 HLS 视频时按需加载，超过此大小的 chunk 仍会触发告警。
    chunkSizeWarningLimit: 520,
    reportCompressedSize: false,
  },
  server: {
    port: 5173,
  },
});
