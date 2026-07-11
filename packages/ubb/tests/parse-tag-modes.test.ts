import { describe, expect, test } from "vite-plus/test";
import { parseUbb } from "../src/index.ts";
import { tag, tagPos, txt } from "./helpers.ts";

const recursiveTextTags = ["b", "i", "u", "del", "english", "left", "center", "right"];

describe("递归标签模式", () => {
  test.each(recursiveTextTags)("%s 递归解析子标签", (name) => {
    expect(parseUbb(`[${name}]外[b]内[/b][/${name}]`)).toEqual([
      tag(name, [txt("外"), tag("b", [txt("内")])]),
    ]);
  });

  test.each([
    ["size", "5"],
    ["color", "#ff0000"],
    ["font", "宋体"],
    ["align", "center"],
    ["cursor", "pointer"],
  ])("%s 将参数保存到 positionals 并递归解析", (name, value) => {
    expect(parseUbb(`[${name}=${value}]外[b]内[/b][/${name}]`)).toEqual([
      tagPos(name, [value], [txt("外"), tag("b", [txt("内")])]),
    ]);
  });

  test("标签名大小写不敏感，参数值保留原样", () => {
    expect(parseUbb("[COLOR=DarkRed]正文[/color]")).toEqual([
      tagPos("color", ["DarkRed"], [txt("正文")]),
    ]);
  });
});

describe("Empty 标签模式", () => {
  test.each(["em01", "ac1001", "ms01", "cc9801", "tb01", "a:001"])(
    "%s 自闭合且不吞后续内容",
    (name) => {
      expect(parseUbb(`前[${name}]后`)).toEqual([txt("前"), tag(name), txt("后")]);
    },
  );

  test("紧随的同名结束标签被忽略", () => {
    expect(parseUbb("[em01][/em01]后")).toEqual([tag("em01"), txt("后")]);
  });
});
