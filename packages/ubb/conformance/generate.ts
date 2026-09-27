/**
 * 一致性语料生成脚本。
 *
 * 用例输入在这里维护，期望值由 TS 参考实现生成，禁止手改 JSON。
 * 运行：vp node conformance/generate.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createUbbRegistry, type UbbNode, type UbbTagMode } from "../src/index.ts";
import { cc98Registry } from "../cc98/index.ts";
import { ubbToHtml } from "../cc98/html.ts";
import { ubbToMarkdown } from "../cc98/markdown.ts";

const SCHEMA = "ubb-conformance/1";
const SPEC_VERSION = "1.0.0";

/** parse-core 的 harness registry 声明，各语言实现按同一声明构建。 */
const CORE_REGISTRY = {
  tags: {
    b: "recursive",
    i: "recursive",
    u: "recursive",
    color: "recursive",
    size: "recursive",
    url: "recursive",
    quote: "recursive",
    spoiler: "recursive",
    code: "text",
    md: "text",
    noubb: "text",
    line: "empty",
    em00: "empty",
    user: "autoclose",
  },
  families: [
    { name: "em", pattern: "^em\\d{2}$", mode: "empty" },
    { name: "ga", pattern: "^ga\\d+$", mode: "empty" },
    { name: "gb", pattern: "^g[a-z]\\d+$", mode: "empty" },
  ],
  parseTag: "default",
  mergeAdjacentText: false,
} as const;

const coreHarness = createUbbRegistry({
  tags: CORE_REGISTRY.tags as Record<string, UbbTagMode>,
  families: Object.fromEntries(
    CORE_REGISTRY.families.map((f) => [f.name, { pattern: new RegExp(f.pattern), mode: f.mode }]),
  ),
});

/** 把 AST 节点序列化成语料规范 JSON。 */
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

interface ParseCase {
  name: string;
  input: string;
  mergeAdjacentText?: boolean;
}

interface RenderCase {
  name: string;
  input: string;
}

const parseCoreCases: ParseCase[] = [
  { name: "plain-text", input: "hello world" },
  { name: "cjk-text", input: "你好，世界" },
  { name: "bold", input: "[b]bold[/b]" },
  { name: "case-insensitive-tag", input: "[B]x[/B]" },
  { name: "attr-position", input: "[color=red]x[/color]" },
  { name: "attr-empty-value", input: "[color=]x[/color]" },
  { name: "attr-value-with-equals", input: "[url=https://a.com?x=1&y=2]link[/url]" },
  { name: "tag-with-value", input: "[b=bold]x[/b]" },
  { name: "unknown-tag-degrades", input: "[xyz]content[/xyz]" },
  { name: "unregistered-in-harness", input: "[table][tr][/tr][/table]" },
  { name: "nested", input: "[b]a[i]b[/i]c[/b]" },
  { name: "same-name-nested", input: "[b]a[b]c[/b]d[/b]" },
  { name: "quote-nested", input: "[quote][quote]inner[/quote]outer[/quote]" },
  { name: "unclosed-recursive", input: "[b]hello" },
  { name: "unclosed-nested", input: "[b]a[i]b" },
  { name: "unclosed-nested-merged", input: "[b]a[i]b", mergeAdjacentText: true },
  { name: "orphan-end-tag", input: "[/b]tail" },
  { name: "misnesting", input: "[b][i]x[/b][/i]" },
  { name: "text-mode", input: "[code]a[b]c[/code]" },
  { name: "text-mode-case-insensitive-end", input: "[CODE]a[/code]" },
  { name: "text-mode-unclosed", input: "[code]abc" },
  { name: "text-mode-empty", input: "[code][/code]" },
  { name: "text-mode-inner-partial-end", input: "[md]x[/ncode]y[/md]" },
  { name: "text-mode-nested-same-name", input: "[md]a[md]b[/md]c[/md]" },
  { name: "empty-tag", input: "[line]" },
  { name: "empty-tag-with-end", input: "[line][/line]" },
  { name: "empty-tag-with-other-end", input: "[line][/b]" },
  { name: "autoclose-unclosed", input: "[user=张三]hello" },
  { name: "autoclose-with-end", input: "[user=张三][b]hi[/b][/user]" },
  { name: "autoclose-unclosed-nested", input: "[user=1][b]x" },
  { name: "family-match", input: "[em01]" },
  { name: "family-exact-priority", input: "[em00]" },
  { name: "family-order-first-wins", input: "[ga1]" },
  { name: "family-second", input: "[gx1]" },
  { name: "family-no-match-three-digits", input: "[em999]" },
  { name: "no-close-bracket", input: "a[b" },
  { name: "empty-brackets", input: "[]" },
  { name: "slash-only", input: "[/]" },
  { name: "name-with-slash-rejected", input: "[a/b]x" },
  { name: "name-with-space-rejected", input: "[b x]" },
  { name: "mixed-roots", input: "a[b]c[/b]d[e]f[/e]" },
  { name: "degraded-adjacent-texts", input: "价格[约[b]100[/b]" },
  { name: "degraded-adjacent-texts-merged", input: "价格[约[b]100[/b]", mergeAdjacentText: true },
];

const parseCc98Cases: ParseCase[] = [
  { name: "static-recursive", input: "[b]x[/b]" },
  { name: "color-position", input: "[color=red]x[/color]" },
  { name: "upload-two-positionals", input: "[upload=jpg,1]x[/upload]" },
  { name: "img-named-attr", input: "[img=1,title=封面]src[/img]" },
  { name: "url-equals-in-value", input: "[url=https://x.com?a=b&t=1]t[/url]" },
  { name: "url-comma-splits-value", input: "[url=https://a.com,1]x[/url]" },
  { name: "quoted-value", input: '[quote="用户 A"]q[/quote]' },
  { name: "single-quoted-value", input: "[quote='用户']q[/quote]" },
  { name: "whitespace-skipped", input: "[ size = 5 ]x[/size]" },
  { name: "uppercase-tag", input: "[COLOR=red]x[/color]" },
  { name: "em-family", input: "[em01]" },
  { name: "ac-family-four-digit", input: "[ac1001]" },
  { name: "ms-family", input: "[ms01]" },
  { name: "mahjong-family", input: "[a:001]" },
  { name: "tb-family", input: "[tb33]" },
  { name: "cc98-family", input: "[cc9801]" },
  { name: "family-invalid-code", input: "[em9]" },
  { name: "user-autoclose", input: "[user=张三]" },
  { name: "user-autoclose-wrapped", input: "[user=张三]名字[/user]" },
  { name: "code-text-mode", input: "[code]a[b]c[/code]" },
  { name: "noubb", input: "[noubb][b]x[/b][/noubb]" },
  { name: "math", input: "[math]E=mc^2[/math]" },
  { name: "md-heading", input: "[md]# 标题[/md]" },
  { name: "bili", input: "[bili]BV1xx411c7mD[/bili]" },
  { name: "size-empty-value", input: "[size=]x[/size]" },
  { name: "table-cell-positionals", input: "[table][tr][td=2,3]c[/td][/tr][/table]" },
  { name: "quotex", input: "[quotex=来源]x[/quotex]" },
  { name: "line-empty", input: "[line]" },
  { name: "needreply-empty", input: "[needreply]" },
  { name: "tokenizer-error-double-equals", input: "[a==b]x" },
  { name: "tokenizer-error-consecutive-values", input: "[a b]x" },
];

const mixedPost = [
  "[quote=用户A][b]原帖[/b][/quote]",
  "[size=5][color=red]回复正文[/color][/size] [em01]",
  "[url=/topic/123]相关帖子[/url]",
  "[table][tr][th]姓名[/th][th]分数[/th][/tr][tr][td]张三[/td][td]90[/td][/tr][/table]",
  "[code]const answer = 42;[/code]",
].join("\n");

const renderHtmlCases: RenderCase[] = [
  { name: "plain-escape", input: 'a < b & c "q"' },
  { name: "script-injection", input: "<script>alert(1)</script>" },
  { name: "bold", input: "[b]x[/b]" },
  { name: "nested-styles", input: "[size=5][color=red]正文[/color][/size]" },
  { name: "font-attr-escape", input: '[font=Arial" onclick="x]f[/font]' },
  { name: "url-relative", input: "[url=/topic/123]相关[/url]" },
  { name: "url-javascript-scheme", input: "[url=javascript:alert(1)]点我[/url]" },
  { name: "url-data-scheme", input: "[url=data:text/html,x]d[/url]" },
  { name: "url-mailto", input: "[url=mailto:a@b.com]mail[/url]" },
  { name: "url-uses-text-when-no-attr", input: "[url]https://a.com[/url]" },
  { name: "url-content-escaped", input: "[url=/x]<b>标签</b>[/url]" },
  { name: "img", input: "[img=1,title=封面]https://a.com/x.png[/img]" },
  { name: "img-title-escape", input: '[img=1,title=a"b]u[/img]' },
  { name: "quote-with-source", input: "[quote=用户A]原帖[/quote]" },
  { name: "quote-no-source", input: "[quote]原帖[/quote]" },
  { name: "code-escape", input: "[code]const x = 1 < 2;[/code]" },
  { name: "line", input: "[line]" },
  {
    name: "table",
    input: "[table][tr][th]姓名[/th][th]分数[/th][/tr][tr][td]张三[/td][td]90[/td][/tr][/table]",
  },
  { name: "table-cell-span", input: "[table][tr][td=2,3]c[/td][/tr][/table]" },
  { name: "md-span", input: "[md]# t[/md]" },
  { name: "noubb-passthrough", input: "[noubb]<b>x</b>[/noubb]" },
  { name: "math-span", input: "[math]E=mc^2[/math]" },
  { name: "audio", input: "[audio]https://a.com/x.mp3[/audio]" },
  { name: "video", input: "[video]https://a.com/x.mp4[/video]" },
  { name: "bili", input: "[bili]BV1xx411c7mD[/bili]" },
  { name: "upload", input: "[upload=jpg,1]https://a.com/f.jpg[/upload]" },
  { name: "user-attr", input: "[user=张三]" },
  { name: "user-wrapped", input: "[user=张三]名字[/user]" },
  { name: "topic", input: "[topic=123]标题[/topic]" },
  { name: "topic-no-content", input: "[topic=123][/topic]" },
  { name: "board", input: "[board=42]板块名[/board]" },
  { name: "pm", input: "[pm=张三]" },
  { name: "emotion-stripped", input: "[em01]" },
  { name: "emotion-invalid-code-stripped", input: "[em99]" },
  {
    name: "permission-tags-stripped",
    input: "[needreply]x[/needreply][posteronly][/posteronly][allowviewer][/allowviewer]",
  },
  { name: "unknown-fallback-keeps-content", input: "[xyz][b]x[/b][/xyz]" },
  { name: "unclosed-degrades", input: "[b]x" },
  { name: "mixed-post", input: `${mixedPost}\n<script>alert(1)</script>` },
];

const renderMarkdownCases: RenderCase[] = [
  { name: "bold", input: "[b]x[/b]" },
  { name: "italic", input: "[i]x[/i]" },
  { name: "underline-passthrough", input: "[u]x[/u]" },
  { name: "strikethrough", input: "[del]x[/del]" },
  {
    name: "style-tags-passthrough",
    input: "[size=5][color=red][font=Arial]x[/font][/color][/size]",
  },
  { name: "url-with-label", input: "[url=/topic/123]相关帖子[/url]" },
  { name: "url-empty-content", input: "[url=https://a.com][/url]" },
  { name: "url-no-attr", input: "[url]https://a.com[/url]" },
  { name: "img", input: "[img=1,title=封面]https://a.com/x.png[/img]" },
  { name: "quote-with-source-multiline", input: "[quote=用户A]行1\n行2[/quote]" },
  { name: "quote-blank-line", input: "[quote]a\n\nb[/quote]" },
  { name: "quote-no-source", input: "[quote]q[/quote]" },
  { name: "code-inline", input: "[code]x`y[/code]" },
  { name: "code-block", input: "[code]a\nb[/code]" },
  { name: "line-leading-finalize", input: "[line]" },
  { name: "line-mid-text", input: "a[line]b" },
  { name: "line-trailing-finalize", input: "a[line]" },
  {
    name: "table",
    input: "[table][tr][th]姓名[/th][th]分数[/th][/tr][tr][td]张三[/td][td]90[/td][/tr][/table]",
  },
  { name: "table-ignores-non-tr", input: "[table][b]x[/b][tr][td]1[/td][/tr][/table]" },
  { name: "md-passthrough", input: "[md]# 标题[/md]" },
  { name: "noubb-escapes-brackets", input: "[noubb][b]x[/b][/noubb]" },
  { name: "math-passthrough", input: "[math]E=mc^2[/math]" },
  { name: "audio-link", input: "[audio]https://a.com/x.mp3[/audio]" },
  { name: "video-link", input: "[video]https://a.com/x.mp4[/video]" },
  { name: "bili-link", input: "[bili]BV1xx411c7mD[/bili]" },
  { name: "upload-passthrough", input: "[upload=jpg,1]f.jpg[/upload]" },
  { name: "user-attr", input: "[user=张三]" },
  { name: "user-content", input: "[user=张三]名字[/user]" },
  { name: "pm", input: "[pm=张三]" },
  { name: "topic", input: "[topic=123]标题[/topic]" },
  { name: "topic-no-content", input: "[topic=123][/topic]" },
  { name: "board", input: "[board=42]板块名[/board]" },
  { name: "emotion-em", input: "[em01]" },
  { name: "emotion-em-zero", input: "[em00]" },
  { name: "emotion-ac-four-digit", input: "[ac1001]" },
  { name: "emotion-mahjong", input: "[a:001]" },
  { name: "emotion-cc98-png", input: "[cc9815]" },
  { name: "emotion-invalid-keeps-raw", input: "[em99]" },
  {
    name: "permission-stripped",
    input: "[needreply]x[/needreply][posteronly][/posteronly][allowviewer][/allowviewer]",
  },
  { name: "mixed-post", input: mixedPost },
];

function parseCoreOutput(input: string, mergeAdjacentText?: boolean): unknown {
  const registry = mergeAdjacentText
    ? coreHarness.configure({ mergeAdjacentText: true })
    : coreHarness;
  return registry.parse(input).map(canonical);
}

function writeJson(name: string, data: unknown): void {
  const dir = join(dirname(import.meta.filename));
  writeFileSync(join(dir, name), `${JSON.stringify(data, null, 2)}\n`);
}

mkdirSync(dirname(import.meta.filename), { recursive: true });

writeJson("parse-core.json", {
  schema: SCHEMA,
  specVersion: SPEC_VERSION,
  kind: "parse-core",
  registry: CORE_REGISTRY,
  cases: parseCoreCases.map(({ name, input, mergeAdjacentText }) => ({
    name,
    input,
    ...(mergeAdjacentText === undefined ? {} : { mergeAdjacentText }),
    expected: parseCoreOutput(input, mergeAdjacentText),
  })),
});

writeJson("parse-cc98.json", {
  schema: SCHEMA,
  specVersion: SPEC_VERSION,
  kind: "parse-cc98",
  cases: parseCc98Cases.map(({ name, input, mergeAdjacentText }) => ({
    name,
    input,
    ...(mergeAdjacentText === undefined ? {} : { mergeAdjacentText }),
    expected: (mergeAdjacentText
      ? cc98Registry.configure({ mergeAdjacentText: true })
      : cc98Registry
    )
      .parse(input)
      .map(canonical),
  })),
});

writeJson("render-html.json", {
  schema: SCHEMA,
  specVersion: SPEC_VERSION,
  kind: "render-html",
  cases: renderHtmlCases.map(({ name, input }) => ({ name, input, expected: ubbToHtml(input) })),
});

writeJson("render-markdown.json", {
  schema: SCHEMA,
  specVersion: SPEC_VERSION,
  kind: "render-markdown",
  cases: renderMarkdownCases.map(({ name, input }) => ({
    name,
    input,
    expected: ubbToMarkdown(input),
  })),
});

console.log("conformance corpus generated");
