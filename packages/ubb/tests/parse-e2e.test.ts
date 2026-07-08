/**
 * UBB 解析器 E2E 测试：真实帖子场景。
 *
 * 与单元测试（单个标签、单个容错场景）不同，E2E 测试模拟 CC98 论坛中
 * 实际帖子的完整 UBB 文本，验证 parseUbb 在复杂混合场景下的端到端正确性。
 *
 * 每个测试包含一段接近真实帖子的 UBB 文本，断言完整的 AST 输出。
 */
import { describe, expect, test } from "vite-plus/test";
import { parseUbb } from "../src/index.ts";
import { txt, tag, tagPos } from "./helpers.ts";

describe("E2E：富文本自我介绍帖", () => {
  test("混合文字样式 + 表情 + 链接 + 嵌套", () => {
    const ubb = [
      "[b]大家好[/b]，我是新来的。[em01]",
      "",
      "[i]今天天气不错[/i]，分享一下我的[url=https://cc98.org]个人主页[/url]。",
      "",
      "[size=5][color=red]重要通知[/color][/size]",
      "",
      "[ac01][ac02][ac03]",
    ].join("\n");

    expect(parseUbb(ubb)).toEqual([
      tag("b", [txt("大家好")]),
      txt("，我是新来的。"),
      tag("em01"),
      txt("\n\n"),
      tag("i", [txt("今天天气不错")]),
      txt("，分享一下我的"),
      tagPos("url", ["https://cc98.org"], [txt("个人主页")]),
      txt("。\n\n"),
      tagPos("size", ["5"], [tagPos("color", ["red"], [txt("重要通知")])]),
      txt("\n\n"),
      tag("ac01"),
      tag("ac02"),
      tag("ac03"),
    ]);
  });
});

describe("E2E：代码分享帖", () => {
  test("code 标签内含多行 + UBB 字面量 + 后续正文", () => {
    const ubb = [
      "分享一下我的代码：",
      "",
      "[code]function hello() {",
      '  console.log("hello");',
      "  return [b]not bold[/b];",
      "}[/code]",
      "",
      "上面的 [b] 不会被加粗。",
    ].join("\n");

    expect(parseUbb(ubb)).toEqual([
      txt("分享一下我的代码：\n\n"),
      tag("code", [
        txt('function hello() {\n  console.log("hello");\n  return [b]not bold[/b];\n}'),
      ]),
      // 代码后面的 [b] 是已知标签，会被解析为标签节点；未关闭则 forceClose 降级为文本 "[b]"
      txt("\n\n上面的 "),
      txt("[b]"),
      txt(" 不会被加粗。"),
    ]);
  });
});

describe("E2E：图片视频分享帖", () => {
  test("混合 img/video/upload + 文字说明", () => {
    const ubb = [
      "[b]我的旅行照片[/b]",
      "",
      "[img]https://example.com/1.jpg[/img]",
      "",
      "[img=0]https://example.com/2.jpg[/img]",
      "",
      "[video]https://example.com/travel.mp4[/video]",
    ].join("\n");

    expect(parseUbb(ubb)).toEqual([
      tag("b", [txt("我的旅行照片")]),
      txt("\n\n"),
      tag("img", [txt("https://example.com/1.jpg")]),
      txt("\n\n"),
      tagPos("img", ["0"], [txt("https://example.com/2.jpg")]),
      txt("\n\n"),
      tag("video", [txt("https://example.com/travel.mp4")]),
    ]);
  });
});

describe("E2E：嵌套引用帖", () => {
  test("双层 quote 嵌套 + 来源参数 + 后续正文", () => {
    const ubb = [
      "[quote=用户A][quote=用户B]原始内容[/quote]",
      "回复B[/quote]",
      "",
      "我的回复",
    ].join("\n");

    expect(parseUbb(ubb)).toEqual([
      tagPos("quote", ["用户A"], [tagPos("quote", ["用户B"], [txt("原始内容")]), txt("\n回复B")]),
      txt("\n\n我的回复"),
    ]);
  });
});

describe("E2E：课程成绩表格帖", () => {
  test("table/tr/th/td 多行多列完整嵌套", () => {
    const ubb = [
      "[table]",
      "[tr][th]姓名[/th][th]分数[/th][/tr]",
      "[tr][td]张三[/td][td]90[/td][/tr]",
      "[tr][td]李四[/td][td]85[/td][/tr]",
      "[/table]",
    ].join("\n");

    expect(parseUbb(ubb)).toEqual([
      tag("table", [
        txt("\n"),
        tag("tr", [tag("th", [txt("姓名")]), tag("th", [txt("分数")])]),
        txt("\n"),
        tag("tr", [tag("td", [txt("张三")]), tag("td", [txt("90")])]),
        txt("\n"),
        tag("tr", [tag("td", [txt("李四")]), tag("td", [txt("85")])]),
        txt("\n"),
      ]),
    ]);
  });
});

describe("E2E：未闭合标签容错（真实用户常犯的错误）", () => {
  test("多个标签未闭合，forceClose 降级保留文本内容", () => {
    const ubb = "[b]加粗但没关[i]斜体也没关\n\n后续文本";

    expect(parseUbb(ubb)).toEqual([
      // [b] 和 [i] 均未关闭，root.close() 触发 forceClose：
      // [b] 降级为文本 "[b]"，"加粗但没关" 提升到 root，
      // [i] 也降级为 "[i]"，"斜体也没关..." 提升到 root
      txt("[b]"),
      txt("加粗但没关"),
      txt("[i]"),
      txt("斜体也没关\n\n后续文本"),
    ]);
  });
});

describe("E2E：站内链接混合帖", () => {
  test("user/topic/board 自闭合与包裹形式混用", () => {
    const ubb =
      "感谢 [user=张三] 的分享，参见 [topic=123]这个帖子[/topic]，来自 [board=456]板块名[/board]。";

    expect(parseUbb(ubb)).toEqual([
      txt("感谢 "),
      tagPos("user", ["张三"]),
      txt(" 的分享，参见 "),
      tagPos("topic", ["123"], [txt("这个帖子")]),
      txt("，来自 "),
      tagPos("board", ["456"], [txt("板块名")]),
      txt("。"),
    ]);
  });
});

describe("E2E：Markdown 与数学公式帖", () => {
  test("md 标签内含 Markdown 语法，math 标签内含 LaTeX", () => {
    const ubb =
      "公式部分：[m]E=mc^2[/m]，详细推导：\n\n[md]\n# 标题\n\n- 列表项 [b]不解析[/b]\n[/md]";

    expect(parseUbb(ubb)).toEqual([
      txt("公式部分："),
      tag("m", [txt("E=mc^2")]),
      txt("，详细推导：\n\n"),
      tag("md", [txt("\n# 标题\n\n- 列表项 [b]不解析[/b]\n")]),
    ]);
  });
});

describe("E2E：复杂混合帖（压力测试）", () => {
  test("文字样式 + 表格 + 引用 + 媒体 + 表情 + 站内链接", () => {
    const ubb = [
      "[quote][b]管理员[/b]说：[/quote]",
      "欢迎大家！点击 [url=https://cc98.org]这里[/url] 注册。",
      "",
      "[table][tr][td][b]名称[/b][/td][td][color=blue]值[/color][/td][/tr][/table]",
      "",
      "[ac01] [em01] [cc9801]",
      "",
      "看这个视频：[bili]BV1xx911y7xz[/bili]",
    ].join("\n");

    expect(parseUbb(ubb)).toEqual([
      tag("quote", [tag("b", [txt("管理员")]), txt("说：")]),
      txt("\n欢迎大家！点击 "),
      tagPos("url", ["https://cc98.org"], [txt("这里")]),
      txt(" 注册。\n\n"),
      tag("table", [
        tag("tr", [
          tag("td", [tag("b", [txt("名称")])]),
          tag("td", [tagPos("color", ["blue"], [txt("值")])]),
        ]),
      ]),
      txt("\n\n"),
      tag("ac01"),
      txt(" "),
      tag("em01"),
      txt(" "),
      tag("cc9801"),
      txt("\n\n看这个视频："),
      tag("bili", [txt("BV1xx911y7xz")]),
    ]);
  });
});
