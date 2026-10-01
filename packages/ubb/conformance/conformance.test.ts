import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { describe, expect, test } from "vite-plus/test";
import { evaluate, type Corpus } from "./contract.ts";

const dir = dirname(import.meta.filename);
const manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8")) as {
  schema: string;
  specVersion: string;
  files: { name: string; kind: Corpus["kind"]; cases: number; sha256: string }[];
};

test("语料清单与版本", () => {
  expect(manifest.schema).toBe("ubb-conformance-manifest/1");
  expect(new Set(manifest.files.map((file) => file.name)).size).toBe(manifest.files.length);
  expect(manifest.files.map((file) => file.kind).sort()).toEqual([
    "parse-cc98",
    "parse-core",
    "render-html",
    "render-markdown",
  ]);
});

for (const file of manifest.files) {
  const raw = readFileSync(join(dir, file.name), "utf8");
  const corpus = JSON.parse(raw) as Corpus;
  describe(file.kind, () => {
    test("结构、摘要和用例数量", () => {
      expect(createHash("sha256").update(raw).digest("hex")).toBe(file.sha256);
      expect(corpus.schema).toBe("ubb-conformance/1");
      expect(corpus.kind).toBe(file.kind);
      expect(corpus.specVersion).toBe(manifest.specVersion);
      expect(corpus.cases.length).toBe(file.cases);
      expect(new Set(corpus.cases.map((item) => item.name)).size).toBe(file.cases);
    });
    test.each(corpus.cases)("$name", (item) => {
      expect(evaluate(corpus.kind, item, corpus.registry)).toEqual(item.expected);
    });
  });
}
