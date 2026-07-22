import { defineConfig } from "vite-plus";
import vue from "@vitejs/plugin-vue";
import UnoCSS from "unocss/vite";

export default defineConfig({
  logLevel: "warn",
  plugins: [UnoCSS(), vue()],
  build: {
    reportCompressedSize: false,
  },
  server: {
    port: 5173,
  },
});
