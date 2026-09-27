import { describe, expect, test } from "vite-plus/test";
import { cc98Registry } from "../cc98/index.ts";
import type { UbbNode, UbbTagNode } from "../src/types.ts";

const rawOf = (source: string) =>
  cc98Registry
    .parse(source)
    .filter((node): node is UbbTagNode => node.type === "tag")
    .map((node) => node.raw);

function toUbb(nodes: readonly UbbNode[]): string {
  return nodes
    .map((node) =>
      node.type === "text"
        ? node.value
        : `${node.raw.open}${toUbb(node.children)}${node.raw.close ?? ""}`,
    )
    .join("");
}

describe("标签原文", () => {
  test("保留开始、结束标签的大小写和参数写法", () => {
    expect(rawOf("[URL='a.com' ]x[/Url][CODE]y[/code]")).toEqual([
      { open: "[URL='a.com' ]", close: "[/Url]" },
      { open: "[CODE]", close: "[/code]" },
    ]);
  });

  test("区分是否写了结束标签", () => {
    expect(rawOf("[user=甲][user=乙]乙[/USER][line][line][/LINE]")).toEqual([
      { open: "[user=甲]", close: null },
      { open: "[user=乙]", close: "[/USER]" },
      { open: "[line]", close: null },
      { open: "[line]", close: "[/LINE]" },
    ]);
  });

  test.each([
    "[B]粗[/b][I]斜[/i]",
    "[b][i]未闭合[/b]后文[/i]",
    "孤立[/B]结束[em01][/EM01][ac99]",
    "[quote=甲,乙][user=丙]正文[/quote][code][b]字面量[/code]",
    "[img=1,title=封面]a.png[/IMG][color=]空参数[/color][foo]未知[/foo]",
    "[noubb][noubb]Test[/noubb][/noubb]价格[约[b]100[/b]",
  ])("按原文拼回解析结果与输入一致：%s", (source) => {
    expect(toUbb(cc98Registry.parse(source))).toBe(source);
  });
});
