import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  fmt: {},
  lint: {
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
  },
  run: {
    cache: true,
    tasks: {
      dev: {
        command:
          "PORTLESS_PORT=1355 PORTLESS_HTTPS=0 PORTLESS_SYNC_HOSTS=0 vp exec portless run --name cc98 vp run website#dev",
        dependsOn: ["@cc98/api#build", "@cc98/ubb#build"],
        cache: false,
      },
      preview: {
        command: [
          "vp run -r build",
          "PORTLESS_PORT=1355 PORTLESS_HTTPS=0 PORTLESS_SYNC_HOSTS=0 vp exec portless run --name cc98-preview vp run website#preview",
        ],
        cache: false,
      },
    },
  },
});
