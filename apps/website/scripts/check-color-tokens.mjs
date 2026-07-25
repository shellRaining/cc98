import { readdir, readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const websiteRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const sourceRoot = resolve(websiteRoot, "src");
const allowedFiles = new Set([
  "src/stores/skins.ts",
  "src/styles/global.css",
  "src/styles/skins.css",
]);
const sourceExtensions = new Set([".css", ".html", ".js", ".mjs", ".ts", ".tsx", ".vue"]);

const checks = [
  { label: "十六进制颜色", pattern: /#[\da-f]{3,8}\b/giu },
  { label: "颜色函数", pattern: /\b(?:rgb|rgba|hsl|hsla|oklch)\(/giu },
  {
    label: "颜色属性",
    pattern:
      /\b(?:color|background(?:-color)?|border(?:-[a-z]+)?-color|outline-color|fill|stroke)\s*:\s*(?:white|black|gray|grey|red|blue|green|yellow|orange|purple|pink)\b/giu,
  },
  {
    label: "原始调色板类",
    pattern:
      /\b(?:text|bg|border|outline|ring|fill|stroke)-(?:white|black|gray|grey|red|blue|green|yellow|amber|orange|purple|pink|slate|zinc|neutral|stone)(?:-\d{2,3})?(?:\/[0-9]+)?\b/giu,
  },
];

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) return collectFiles(path);
      return sourceExtensions.has(entry.name.slice(entry.name.lastIndexOf("."))) ? [path] : [];
    }),
  );
  return files.flat();
}

const violations = [];

for (const file of await collectFiles(sourceRoot)) {
  const displayPath = relative(websiteRoot, file);
  if (allowedFiles.has(displayPath)) continue;

  const lines = (await readFile(file, "utf8")).split("\n");
  for (const [index, line] of lines.entries()) {
    if (line.includes("color-literal-allowed")) continue;
    for (const check of checks) {
      check.pattern.lastIndex = 0;
      if (check.pattern.test(line)) {
        violations.push(`${displayPath}:${index + 1} [${check.label}] ${line.trim()}`);
      }
    }
  }
}

if (violations.length) {
  console.error("业务源码只能消费颜色 token，发现以下颜色字面量：\n");
  console.error(violations.join("\n"));
  process.exitCode = 1;
} else {
  console.log("颜色 token 检查通过");
}
