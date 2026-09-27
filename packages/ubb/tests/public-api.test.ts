import { readdirSync, readFileSync } from "node:fs";
import { expect, test } from "vite-plus/test";
import * as ubb from "../src/index.ts";

test("根入口只暴露注册器相关的运行时 API，不导出底层 parseUbb", () => {
  expect(Object.keys(ubb).sort()).toEqual([
    "UBB_VERSION",
    "createUbbRegistry",
    "getUbbTextContent",
    "parseUbbTag",
  ]);
});

test("发布代码不导入任何外部包，保持框架无关", () => {
  const packageRoot = new URL("../", import.meta.url);
  const externalImports = ["src", "cc98"].flatMap((dir) =>
    readdirSync(new URL(dir, packageRoot), { recursive: true, encoding: "utf8" })
      .filter((file) => file.endsWith(".ts"))
      .flatMap((file) => {
        const source = readFileSync(new URL(`${dir}/${file}`, packageRoot), "utf8");
        return [...source.matchAll(/\b(?:from|import)\s*\(?\s*["']([^"']+)["']/g)]
          .map((match) => match[1])
          .filter((specifier) => !specifier.startsWith("."))
          .map((specifier) => `${dir}/${file}: ${specifier}`);
      }),
  );
  expect(externalImports).toEqual([]);
});

test("UBB_VERSION 与 package.json 的版本一致", () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  expect(ubb.UBB_VERSION).toBe(pkg.version);
});
