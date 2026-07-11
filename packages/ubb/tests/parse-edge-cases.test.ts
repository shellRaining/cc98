import { describe, expect, test } from "vite-plus/test";
import { parseUbb } from "../src/index.ts";
import { tag, tagBoth, tagNamed, tagPos, txt } from "./helpers.ts";

describe("属性边界", () => {
  test("同时保留多个位置参数和命名参数", () => {
    expect(parseUbb("[img=1,2,title=封面]http://x.com/a.png[/img]")).toEqual([
      tagBoth("img", ["1", "2"], { title: "封面" }, [txt("http://x.com/a.png")]),
    ]);
  });

  test("保留空参数值", () => {
    expect(parseUbb("[quote=]内容[/quote]")).toEqual([tagPos("quote", [""], [txt("内容")])]);
    expect(parseUbb("[audio,title=]a.mp3[/audio]")).toEqual([
      tagNamed("audio", { title: "" }, [txt("a.mp3")]),
    ]);
  });
});

describe("组合结构", () => {
  test("递归标签支持多层异构嵌套", () => {
    expect(parseUbb("[table][tr][td][size=5][b]内容[/b][/size][/td][/tr][/table]")).toEqual([
      tag("table", [tag("tr", [tag("td", [tagPos("size", ["5"], [tag("b", [txt("内容")])])])])]),
    ]);
  });

  test("相邻的 recursive、text 和 empty 标签保持兄弟关系", () => {
    expect(parseUbb("[b]粗[/b][code][i]字面量[/i][/code][em01]尾")).toEqual([
      tag("b", [txt("粗")]),
      tag("code", [txt("[i]字面量[/i]")]),
      tag("em01"),
      txt("尾"),
    ]);
  });
});

describe("文本和空节点边界", () => {
  test.each(["这不是[标签", "文本[]文本", "文本[/]文本"])("保留非标签方括号：%s", (input) => {
    expect(parseUbb(input).map((node) => (node.type === "text" ? node.value : ""))).toEqual(
      expect.arrayContaining([expect.stringContaining("[")]),
    );
  });

  test("空标签和纯换行保持稳定 AST", () => {
    expect(parseUbb("[b][i][/i][/b]")).toEqual([tag("b", [tag("i")])]);
    expect(parseUbb("\n\n\n")).toEqual([txt("\n\n\n")]);
  });
});
