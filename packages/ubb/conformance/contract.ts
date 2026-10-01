import { createUbbRegistry, type UbbNode, type UbbTagMode } from "../src/index.ts";
import { cc98Registry, parseCc98Tag } from "../cc98/index.ts";
import { ubbToHtml } from "../cc98/html.ts";
import { ubbToMarkdown } from "../cc98/markdown.ts";

export interface RegistrySpec {
  tags: Record<string, UbbTagMode>;
  families: { name: string; pattern: string; mode: UbbTagMode }[];
  parseTag: "default" | "cc98";
  mergeAdjacentText: boolean;
}

export interface InputCase {
  name: string;
  input: string;
  mergeAdjacentText?: boolean;
  registry?: RegistrySpec;
  note?: string;
}

export type CorpusKind = "parse-core" | "parse-cc98" | "render-html" | "render-markdown";

export interface Corpus {
  schema: "ubb-conformance/1";
  specVersion: string;
  kind: CorpusKind;
  registry?: RegistrySpec;
  cases: (InputCase & { expected: unknown })[];
}

export function createHarness(spec: RegistrySpec) {
  return createUbbRegistry({
    tags: spec.tags,
    families: Object.fromEntries(
      spec.families.map(({ name, pattern, mode }) => [
        name,
        { pattern: new RegExp(pattern), mode },
      ]),
    ),
    parseTag: spec.parseTag === "cc98" ? parseCc98Tag : undefined,
    mergeAdjacentText: spec.mergeAdjacentText,
  });
}

export function canonical(node: UbbNode): unknown {
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

/** 用例 registry 完整替换文件声明；用例的布尔值优先于 registry 默认值。 */
export function evaluate(kind: CorpusKind, item: InputCase, spec?: RegistrySpec): unknown {
  if (kind === "render-html") return ubbToHtml(item.input);
  if (kind === "render-markdown") return ubbToMarkdown(item.input);
  const declaration = item.registry ?? spec;
  let registry = kind === "parse-cc98" ? cc98Registry : createHarness(declaration!);
  if (item.mergeAdjacentText !== undefined) {
    registry = registry.configure({ mergeAdjacentText: item.mergeAdjacentText });
  }
  return registry.parse(item.input).map(canonical);
}
