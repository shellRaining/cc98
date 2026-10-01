import type { InputCase, RegistrySpec } from "./contract.ts";

/** 所有生成输入都有固定上限，种子变更会产生可审查的语料差异。 */
export function combinations(seed: number, count: number): InputCase[] {
  let state = seed >>> 0;
  const next = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state;
  };
  const pieces = [
    "[b]",
    "[/b]",
    "[i]",
    "[/i]",
    "[user=张三]",
    "[/user]",
    "[code]",
    "[/code]",
    "[line]",
    "[/line]",
    "[em01]",
    "[url=]",
    "[/url]",
    "正文",
    "x",
    "\n",
    "[bad]",
    "[quote]",
    "[/quote]",
    "[img=1,title=封面]",
    "[/img]",
    "[b=]",
    "[",
    "]",
    "😀",
    "[table]",
    "[tr]",
    "[td]",
    "[/table]",
    "[needreply]",
    "[color=red]",
    "[/color]",
  ];
  return Array.from({ length: count }, (_, index) => {
    const length = 1 + (next() % 24);
    let input = "";
    for (let i = 0; i < length; i++) input += pieces[(next() >>> 8) % pieces.length];
    return { name: `generated-${seed}-${index}`, input };
  });
}

export function boundaryCases(): InputCase[] {
  const cases: InputCase[] = [
    { name: "empty-input", input: "" },
    { name: "empty-recursive", input: "[b][/b]" },
    { name: "empty-text", input: "[code][/code]" },
    { name: "empty-autoclose", input: "[user=][/user]" },
    { name: "crlf-and-nul", input: "a\r\nb\u0000[b]c\r\n[/b]" },
    { name: "duplicate-named", input: "[img=1,title=a,title=b]x[/img]" },
    {
      name: "prototype-key",
      input: "[img=1,__proto__=x,title=y]u[/img]",
      note: "兼容 JS 普通对象属性赋值：__proto__ 字符串赋值不产生自有属性。",
    },
    { name: "quoted-commas", input: '[quote="a,b=c"]x[/quote]' },
    { name: "unclosed-quote", input: '[quote="a,b]x[/quote]' },
    { name: "empty-positionals", input: "[td=,,]x[/td]" },
    { name: "misnested-autoclose", input: "[b][user=x][i]a[/b]b[/i]" },
    { name: "force-close-siblings", input: "[b]a[i]b[/i][u]c[line]d" },
    { name: "unicode-digits-fullwidth", input: "[em１２][ga１]" },
    { name: "unicode-digits-arabic", input: "[em١٢][ga١]" },
    { name: "empty-link-attributes", input: "[url=]x[/url][pm=]x[/pm][user=]x[/user]" },
    { name: "protocol-case", input: "[url=HTTPS://example.com?a=1&b=2]x[/url]" },
    { name: "protocol-controls", input: "[url=java\tscript:alert(1)]x[/url]" },
    { name: "protocol-relative", input: "[img]//example.com/a.png[/img]" },
    {
      name: "table-ragged",
      input: "[table][tr][td]a[/td][/tr]x[tr][th]b[/th][td]c[/td][/tr][/table]",
    },
    { name: "table-empty", input: "[table][tr][/tr][/table]" },
    { name: "table-finalize-scope", input: "[table][tr][td][line][/td][/tr][/table]" },
    { name: "nested-quotes", input: "[quote=a]x\n[quote=b]y\n\nz[/quote][/quote]" },
    { name: "markdown-delimiters", input: "[code]```\n`x`\n```[/code][img=1,title=a]b)c[/img]" },
  ];
  for (const code of [
    0x9, 0xa, 0xb, 0xc, 0xd, 0x20, 0x85, 0xa0, 0x1680, 0x2000, 0x200b, 0x2028, 0x2029, 0x202f,
    0x205f, 0x3000, 0xfeff,
  ]) {
    const ws = String.fromCodePoint(code);
    cases.push(
      { name: `whitespace-${code}-head`, input: `[${ws}b]x[/b]` },
      { name: `whitespace-${code}-value`, input: `[url=${ws}https://x]x[/url]` },
      { name: `whitespace-${code}-quote`, input: `[quote]${ws}[/quote]` },
    );
  }
  for (const char of ["K", "Ⱥ", "ẞ", "Σ", "𐐀", "😀", "İ"]) {
    const note =
      char === "İ"
        ? "兼容 JS 历史行为：整体小写扩展 UTF-16 长度后仍以相同偏移切原文，本轮不修正。"
        : undefined;
    cases.push(
      { name: `unicode-${char.codePointAt(0)}-prefix`, input: `${char}[code]x[/code]`, note },
      { name: `unicode-${char.codePointAt(0)}-content`, input: `[code]${char}[/code]`, note },
      { name: `unicode-${char.codePointAt(0)}-empty`, input: `${char}[line][/line]`, note },
    );
  }
  for (const tag of [
    "b",
    "i",
    "u",
    "del",
    "english",
    "left",
    "center",
    "right",
    "size",
    "color",
    "font",
    "align",
    "cursor",
    "url",
    "table",
    "tr",
    "td",
    "th",
    "quote",
    "quotex",
    "user",
    "topic",
    "board",
    "pm",
    "code",
    "md",
    "noubb",
    "img",
    "audio",
    "mp3",
    "video",
    "upload",
    "bili",
    "math",
    "m",
    "line",
    "needreply",
    "posteronly",
    "allowviewer",
  ]) {
    cases.push({
      name: `static-${tag}`,
      input: `[${tag}=x]a[b]b[/b]&<"[/` + tag.toUpperCase() + "]",
    });
  }
  return cases;
}

export function configurationCases(base: RegistrySpec): InputCase[] {
  const merged = { ...base, mergeAdjacentText: true };
  return [
    { name: "registry-default-merge", input: "a[bad]b[/bad]", registry: merged },
    {
      name: "case-overrides-merge-false",
      input: "a[bad]b[/bad]",
      registry: merged,
      mergeAdjacentText: false,
    },
    {
      name: "case-overrides-merge-true",
      input: "a[bad]b[/bad]",
      registry: base,
      mergeAdjacentText: true,
    },
    {
      name: "registry-cc98-tokenizer",
      input: "[quote=a,b=1]x[/quote]",
      registry: { ...base, parseTag: "cc98" },
    },
    { name: "registry-empty", input: "[b]x[/b]", registry: { ...base, tags: {}, families: [] } },
    {
      name: "registry-custom-text",
      input: "[spoiler][b]x[/b][/spoiler]",
      registry: { ...base, tags: { spoiler: "text" } },
    },
    {
      name: "registry-unicode-name",
      input: "[Σ]x[/σ][K]y[/k]",
      registry: { ...base, tags: { σ: "recursive", k: "recursive" } },
    },
  ];
}
