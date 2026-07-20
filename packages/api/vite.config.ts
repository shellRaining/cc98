import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { defineConfig } from "vite-plus";

const typescriptNativePackage = `@typescript/typescript-${process.platform}-${process.arch}`;
const require = createRequire(import.meta.resolve("typescript/package.json"));
const tsgoPath = resolve(
  dirname(require.resolve(`${typescriptNativePackage}/package.json`)),
  "lib",
  process.platform === "win32" ? "tsc.exe" : "tsc",
);

export default defineConfig({
  pack: {
    dts: { sourcemap: true, tsgo: { path: tsgoPath } },
    exports: true,
  },
  lint: {
    options: { typeAware: true, typeCheck: true },
  },
  fmt: {},
});
