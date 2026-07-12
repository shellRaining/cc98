import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite-plus";

const tsgoPath = resolve(
  dirname(fileURLToPath(import.meta.resolve("typescript/package.json"))),
  "bin/tsc",
);

export default defineConfig({
  pack: {
    dts: { tsgo: { path: tsgoPath } },
    exports: true,
  },
  lint: {
    options: { typeAware: true, typeCheck: true },
  },
  fmt: {},
});
