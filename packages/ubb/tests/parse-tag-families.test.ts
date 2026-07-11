import { describe, expect, test } from "vite-plus/test";
import { parseUbb } from "../src/index.ts";
import { tag, tagPos, txt } from "./helpers.ts";

describe("Text 标签族", () => {
  test.each(["code", "md", "noubb", "img", "audio", "mp3", "video", "upload", "bili", "math", "m"])(
    "%s 将内部 UBB 保留为单个文本节点",
    (name) => {
      expect(parseUbb(`[${name}]前[b]字面量[/b]后[/${name}]`)).toEqual([
        tag(name, [txt("前[b]字面量[/b]后")]),
      ]);
    },
  );

  test("Text 标签保留多行内容", () => {
    expect(parseUbb("[code]第一行\n第二行[/code]")).toEqual([tag("code", [txt("第一行\n第二行")])]);
  });
});

describe("Recursive 结构标签族", () => {
  test("url 同时保留目标参数和递归链接文字", () => {
    expect(parseUbb("[url=https://cc98.org]前[b]链接[/b][/url]")).toEqual([
      tagPos("url", ["https://cc98.org"], [txt("前"), tag("b", [txt("链接")])]),
    ]);
  });

  test("表格按 table > tr > th/td 建树并允许单元格递归", () => {
    expect(parseUbb("[table][tr][th]标题[/th][td][b]内容[/b][/td][/tr][/table]")).toEqual([
      tag("table", [tag("tr", [tag("th", [txt("标题")]), tag("td", [tag("b", [txt("内容")])])])]),
    ]);
  });

  test.each(["quote", "quotex"])("%s 保留来源并递归建树", (name) => {
    expect(parseUbb(`[${name}=用户A]前[b]引用[/b][/${name}]`)).toEqual([
      tagPos(name, ["用户A"], [txt("前"), tag("b", [txt("引用")])]),
    ]);
  });
});

describe("AutoClose 站内链接标签族", () => {
  test.each(["user", "topic", "board", "pm"])("%s 支持仅参数形式", (name) => {
    expect(parseUbb(`[${name}=目标]后`)).toEqual([tagPos(name, ["目标"]), txt("后")]);
  });

  test.each(["user", "topic", "board", "pm"])("%s 支持显式包裹文字", (name) => {
    expect(parseUbb(`[${name}=目标]显示文字[/${name}]`)).toEqual([
      tagPos(name, ["目标"], [txt("显示文字")]),
    ]);
  });
});

describe("Empty 结构与权限标签族", () => {
  test("line 自闭合且不吞相邻文本", () => {
    expect(parseUbb("前[line]后")).toEqual([txt("前"), tag("line"), txt("后")]);
  });

  test.each(["needreply", "posteronly", "allowviewer"])("%s 保留提示索引参数", (name) => {
    expect(parseUbb(`[${name}=2]后`)).toEqual([tagPos(name, ["2"]), txt("后")]);
  });
});
