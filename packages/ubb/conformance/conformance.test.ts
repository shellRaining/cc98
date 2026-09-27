/** 一致性语料回读测试：TS 参考实现必须与语料逐字节一致。 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, expect, test } from "vite-plus/test";
import { createUbbRegistry, type UbbNode, type UbbTagMode } from "../src/index.ts";
import { cc98Registry } from "../cc98/index.ts";
import { ubbToHtml } from "../cc98/html.ts";
import { ubbToMarkdown } from "../cc98/markdown.ts";

const dir = dirname(import.meta.filename);

function load(file: string) {
  return JSON.parse(readFileSync(join(dir, file), "utf8")) as {
    schema: string;
    specVersion: string;
    kind: string;
    registry?: {
      tags: Record<string, string>;
      families: { name: string; pattern: string; mode: string }[];
    };
    cases: { name: string; input: string; mergeAdjacentText?: boolean; expected: unknown }[];
  };
}

function canonical(node: UbbNode): unknown {
  if (node.type === "text") return { type: "text", value: node.value };
  return {
    type: "tag",
    tag: node.tag,
    family: node.family ?? null,
    attrs: { positionals: node.attrs.positionals, named: node.attrs.named },
    raw: { open: node.raw.open, close: node.raw.close },
    children: node.children.map(canonical),
  };
}

describe("UBB 一致性语料", () => {
  test("parse-core", () => {
    const corpus = load("parse-core.json");
    expect(corpus.schema).toBe("ubb-conformance/1");
    const spec = corpus.registry!;
    const harness = createUbbRegistry({
      tags: spec.tags as Record<string, UbbTagMode>,
      families: Object.fromEntries(
        spec.families.map((f) => [
          f.name,
          { pattern: new RegExp(f.pattern), mode: f.mode as UbbTagMode },
        ]),
      ) as Record<string, { pattern: RegExp; mode: UbbTagMode }>,
    });
    for (const { name, input, mergeAdjacentText, expected } of corpus.cases) {
      const registry = mergeAdjacentText ? harness.configure({ mergeAdjacentText: true }) : harness;
      expect(registry.parse(input).map(canonical), name).toEqual(expected);
    }
  });

  test("parse-cc98", () => {
    const corpus = load("parse-cc98.json");
    for (const { name, input, mergeAdjacentText, expected } of corpus.cases) {
      const registry = mergeAdjacentText
        ? cc98Registry.configure({ mergeAdjacentText: true })
        : cc98Registry;
      expect(registry.parse(input).map(canonical), name).toEqual(expected);
    }
  });

  test("render-html", () => {
    const corpus = load("render-html.json");
    for (const { name, input, expected } of corpus.cases) {
      expect(ubbToHtml(input), name).toBe(expected);
    }
  });

  test("render-markdown", () => {
    const corpus = load("render-markdown.json");
    for (const { name, input, expected } of corpus.cases) {
      expect(ubbToMarkdown(input), name).toBe(expected);
    }
  });
});
