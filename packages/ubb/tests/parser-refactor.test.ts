import { describe, expect, test } from "vite-plus/test";
import { cc98Registry, parseCc98Tag } from "../cc98/index.ts";
import { createUbbRegistry } from "../src/index.ts";
import { tag, tagBoth, tagPos, txt, withoutRaw } from "./helpers.ts";

describe("解析重构：原文位置", () => {
  test.each([
    ["İ[code]甲[/CoDe]乙😀", "İ", "甲", "乙😀"],
    ["前😀[code]İ甲😀[/CoDe]İ尾", "前😀", "İ甲😀", "İ尾"],
  ])("text 模式不把小写偏移用于原文：%s", (source, prefix, content, tail) => {
    const nodes = cc98Registry.parse(source);
    expect(withoutRaw(nodes)).toEqual([txt(prefix), tag("code", [txt(content)]), txt(tail)]);
    expect(nodes[1]).toMatchObject({ raw: { open: "[code]", close: "[/CoDe]" } });
  });

  test("İ 前缀后的 empty 只消费紧邻结束标签，后续正文和孤立结束标签保留", () => {
    const nodes = cc98Registry.parse("İ[line][/LiNe]😀尾[line]İ[/line]末");
    expect(withoutRaw(nodes)).toEqual([
      txt("İ"),
      tag("line"),
      txt("😀尾"),
      tag("line"),
      txt("İ"),
      txt("[/line]"),
      txt("末"),
    ]);
    expect(nodes[1]).toMatchObject({ raw: { open: "[line]", close: "[/LiNe]" } });
    expect(nodes[3]).toMatchObject({ raw: { open: "[line]", close: null } });
  });

  test("Unicode 自定义 text 标签按候选名称匹配，关闭长度仍来自原文", () => {
    const registry = createUbbRegistry().register("İ块", "text");
    const nodes = registry.parse("İ😀[İ块]甲İ[b]字面[/b][/i\u0307块]尾😀");
    expect(withoutRaw(nodes)).toEqual([
      txt("İ😀"),
      tag("i\u0307块", [txt("甲İ[b]字面[/b]")]),
      txt("尾😀"),
    ]);
    expect(nodes[1]).toMatchObject({ raw: { open: "[İ块]", close: "[/i\u0307块]" } });
  });
});

describe("解析重构：标签头方言", () => {
  test.each([undefined, "literal"] as const)(
    "通用 %s 方言保留参数原值和首个 ] 边界",
    (tagSyntax) => {
      const registry = createUbbRegistry({ tagSyntax }).register("item", "recursive");
      expect(withoutRaw(registry.parse('[item=  "a""b",x=1=2  ]正文[/item]'))).toEqual([
        tagPos("item", ['  "a""b",x=1=2  '], [txt("正文")]),
      ]);
      expect(withoutRaw(registry.parse('[item="a]b"]正文[/item]尾'))).toEqual([
        tagPos("item", ['"a'], [txt('b"]正文')]),
        txt("尾"),
      ]);
    },
  );

  test("quoted 配置经 configure、register 保留，切回 literal 不改变旧 registry", () => {
    const base = createUbbRegistry({ parseTag: parseCc98Tag });
    const quoted = base.configure({ tagSyntax: "quoted" }).register("item", "recursive");
    const source = '[item="a]b"]正文[/item]';
    expect(withoutRaw(quoted.configure({ mergeAdjacentText: true }).parse(source))).toEqual([
      tagPos("item", ["a]b"], [txt("正文")]),
    ]);
    const literal = quoted.configure({ tagSyntax: "literal" });
    const expectedLiteral = [tagPos("item", ["a"], [txt('b"]正文')])];
    expect(withoutRaw(literal.parse(source))).toEqual(expectedLiteral);
    expect(withoutRaw(base.register("item", "recursive").parse(source))).toEqual(expectedLiteral);
    expect(withoutRaw(quoted.parse(source))).toEqual([tagPos("item", ["a]b"], [txt("正文")])]);
  });

  test("CC98 支持 = 与逗号后空白起始的引号，保留引号内 []、逗号和等号", () => {
    const open = `[URL=  "https://a.test/[a]b?x=1,y=2", '甲]乙',title= '题]名']`;
    const nodes = cc98Registry.parse(`${open}正文[/UrL]尾`);
    expect(withoutRaw(nodes)).toEqual([
      tagBoth("url", ["https://a.test/[a]b?x=1,y=2", "甲]乙"], { title: "题]名" }, [txt("正文")]),
      txt("尾"),
    ]);
    expect(nodes[0]).toMatchObject({ raw: { open, close: "[/UrL]" } });
  });

  test("全部成对同类引号转义为单字符，异类引号作为原值", () => {
    const header = `font="a""b""c]'d",'e''f''g]"h',title="i""j""k"`;
    const attrs = { positionals: [`a"b"c]'d`, `e'f'g]"h`], named: { title: 'i"j"k' } };
    expect(parseCc98Tag(header)).toEqual({ name: "font", attrs });
    const nodes = cc98Registry.parse(`[${header}]正文[/FONT]尾`);
    expect(withoutRaw(nodes)).toEqual([
      tagBoth("font", attrs.positionals, attrs.named, [txt("正文")]),
      txt("尾"),
    ]);
    expect(nodes[0]).toMatchObject({ raw: { open: `[${header}]`, close: "[/FONT]" } });
  });

  test.each([`item=a"`, `item=a'`, `it"em`, `it'em`])(
    "不在参数值开始处的引号不会吞掉后续标签：%s",
    (header) => {
      const seen: string[] = [];
      const registry = createUbbRegistry({
        tagSyntax: "quoted",
        tags: { item: "empty" },
        parseTag: (source) => {
          seen.push(source);
          return { name: "item", attrs: { positionals: [source], named: {} } };
        },
      });
      expect(withoutRaw(registry.parse(`[${header}]尾[item]`))).toEqual([
        tagPos("item", [header]),
        txt("尾"),
        tagPos("item", ["item"]),
      ]);
      expect(seen).toEqual([header, "item"]);
    },
  );

  test.each([
    [`"未闭合`, "未闭合"],
    [`'未闭合`, "未闭合"],
    [`"单引号'`, "单引号'"],
    [`'双引号"`, '双引号"'],
  ])("不匹配引号 %s 回退首个 ] 并沿用旧式参数容错", (value, expected) => {
    const open = `[font=${value}]`;
    const nodes = cc98Registry.parse(`${open}[b]恢复[/b][/font]尾`);
    expect(withoutRaw(nodes)).toEqual([
      tagPos("font", [expected], [tag("b", [txt("恢复")])]),
      txt("尾"),
    ]);
    expect(nodes[0]).toMatchObject({ raw: { open, close: "[/font]" } });
  });

  test("未闭合引号回退后参数仍非法时原文降级，后续 b 可恢复", () => {
    expect(withoutRaw(cc98Registry.parse('[font=="坏][b]恢复[/b]尾'))).toEqual([
      txt('[font=="坏]'),
      tag("b", [txt("恢复")]),
      txt("尾"),
    ]);
  });
});

describe("解析重构：错配、EOF 与文本边界", () => {
  test.each([false, true])("深错配和 EOF 保持深度优先顺序，merge=%s", (mergeAdjacentText) => {
    const registry = createUbbRegistry({
      tags: { b: "recursive", i: "recursive", u: "recursive", line: "empty" },
      mergeAdjacentText,
    });
    const source = "前[b]甲[i]乙[u]丙[/b][/i]后[line][b]丁[i]戊";
    expect(withoutRaw(registry.parse(source))).toEqual(
      mergeAdjacentText
        ? [
            txt("前"),
            tag("b", [txt("甲[i]乙[u]丙")]),
            txt("[/i]后"),
            tag("line"),
            txt("[b]丁[i]戊"),
          ]
        : [
            txt("前"),
            tag("b", [txt("甲"), txt("[i]"), txt("乙"), txt("[u]"), txt("丙")]),
            txt("[/i]"),
            txt("后"),
            tag("line"),
            txt("[b]"),
            txt("丁"),
            txt("[i]"),
            txt("戊"),
          ],
    );
  });

  test.each([false, true])(
    "宽 EOF 提升已闭合子树，标签阻断文本合并，merge=%s",
    (mergeAdjacentText) => {
      const registry = createUbbRegistry({
        tags: { b: "recursive", i: "recursive" },
        mergeAdjacentText,
      });
      const count = 512;
      const source = `前[b]${Array.from({ length: count }, (_, i) => `${i}[i]字${i}[/i]`).join("")}尾`;
      const expected = [txt(mergeAdjacentText ? "前[b]0" : "前")];
      if (!mergeAdjacentText) expected.push(txt("[b]"), txt("0"));
      for (let i = 0; i < count; i++) {
        expected.push(tag("i", [txt(`字${i}`)]), txt(i === count - 1 ? "尾" : String(i + 1)));
      }
      expect(withoutRaw(registry.parse(source))).toEqual(expected);
    },
  );

  test.each([false, true])("深 EOF 与孤立结束标签不丢顺序，merge=%s", (mergeAdjacentText) => {
    const registry = createUbbRegistry({ tags: { b: "recursive" }, mergeAdjacentText });
    const count = 2000;
    const body = "[b]甲[/z]".repeat(count);
    const nodes = registry.parse(`${body}尾`);
    expect(nodes).toEqual(
      mergeAdjacentText
        ? [txt(`${body}尾`)]
        : [
            ...Array.from({ length: count }, () => [txt("[b]"), txt("甲"), txt("[/z]")]).flat(),
            txt("尾"),
          ],
    );
  });
});
