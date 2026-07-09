/**
 * UBB 解析器边缘场景测试。
 *
 * 补充单元测试和 E2E 测试未覆盖的边界条件：
 * - 多位置参数标签（td/upload 双参数）
 * - 深度嵌套（三层以上）
 * - 连续 Text 模式标签
 * - 混合大小写标签名
 * - 特殊字符在文本中
 * - 标签属性边界（空命名参数、引号嵌套）
 *
 * 注意：混合大小写用例断言的是新解析器的宽松兼容行为。原项目 Core.tsx 中具名 handler
 * 查找大小写敏感，只有正则标签多数通过 /i 支持大小写不敏感。
 */
import { describe, expect, test } from "vite-plus/test";
import { parseUbb } from "../src/index.ts";
import { txt, tag, tagPos, tagNamed, tagBoth } from "./helpers.ts";

describe("多位置参数", () => {
  test("[td=2,3] rowspan 和 colspan 双参数", () => {
    expect(parseUbb("[td=2,3]内容[/td]")).toEqual([tagPos("td", ["2", "3"], [txt("内容")])]);
  });

  test("[th=1,2] 表头双参数", () => {
    expect(parseUbb("[th=1,2]表头[/th]")).toEqual([tagPos("th", ["1", "2"], [txt("表头")])]);
  });

  test("[upload=jpg,1] 扩展名和显示模式双参数", () => {
    expect(parseUbb("[upload=jpg,1]http://example.com/a.jpg[/upload]")).toEqual([
      tagPos("upload", ["jpg", "1"], [txt("http://example.com/a.jpg")]),
    ]);
  });

  test("[upload=pdf,0] 非图片扩展名", () => {
    expect(parseUbb("[upload=pdf,0]http://example.com/d.pdf[/upload]")).toEqual([
      tagPos("upload", ["pdf", "0"], [txt("http://example.com/d.pdf")]),
    ]);
  });
});

describe("深度嵌套", () => {
  test("三层递归 [b][i][u]text[/u][/i][/b]", () => {
    expect(parseUbb("[b][i][u]深层[/u][/i][/b]")).toEqual([
      tag("b", [tag("i", [tag("u", [txt("深层")])])]),
    ]);
  });

  test("四层递归 [b][i][u][del]text[/del][/u][/i][/b]", () => {
    expect(parseUbb("[b][i][u][del]四层[/del][/u][/i][/b]")).toEqual([
      tag("b", [tag("i", [tag("u", [tag("del", [txt("四层")])])])]),
    ]);
  });

  test("混合标签嵌套 [size=5][color=red][b]text[/b][/color][/size]", () => {
    expect(parseUbb("[size=5][color=red][b]混合[/b][/color][/size]")).toEqual([
      tagPos("size", ["5"], [tagPos("color", ["red"], [tag("b", [txt("混合")])])]),
    ]);
  });

  test("表格深度嵌套 table>tr>td>b>i", () => {
    expect(parseUbb("[table][tr][td][b][i]单元格[/i][/b][/td][/tr][/table]")).toEqual([
      tag("table", [tag("tr", [tag("td", [tag("b", [tag("i", [txt("单元格")])])])])]),
    ]);
  });
});

describe("连续 Text 模式标签", () => {
  test("两个 code 连续", () => {
    expect(parseUbb("[code]a[/code][code]b[/code]")).toEqual([
      tag("code", [txt("a")]),
      tag("code", [txt("b")]),
    ]);
  });

  test("code 和 md 连续", () => {
    expect(parseUbb("[code]x=1[/code][md]**粗**[/md]")).toEqual([
      tag("code", [txt("x=1")]),
      tag("md", [txt("**粗**")]),
    ]);
  });

  test("img 和 video 连续", () => {
    expect(parseUbb("[img]http://x.com/1.png[/img][video]http://x.com/v.mp4[/video]")).toEqual([
      tag("img", [txt("http://x.com/1.png")]),
      tag("video", [txt("http://x.com/v.mp4")]),
    ]);
  });
});

describe("混合大小写", () => {
  test("[B][i]混合[/I][/b] 大小写不一致也能匹配", () => {
    expect(parseUbb("[B][i]混合[/I][/b]")).toEqual([tag("b", [tag("i", [txt("混合")])])]);
  });

  test("[CODE]内容[/code] Text 模式大小写不一致", () => {
    expect(parseUbb("[CODE]内容[/code]")).toEqual([tag("code", [txt("内容")])]);
  });

  test("[URL=ADDR]text[/url] 参数值保留原样大小写", () => {
    expect(parseUbb("[URL=https://CC98.org]链接[/url]")).toEqual([
      tagPos("url", ["https://CC98.org"], [txt("链接")]),
    ]);
  });
});

describe("属性边界", () => {
  test("[img=1,title=] 空命名参数值", () => {
    expect(parseUbb("[img=1,title=]http://x.com/a.png[/img]")).toEqual([
      tagBoth("img", ["1"], { title: "" }, [txt("http://x.com/a.png")]),
    ]);
  });

  test("[quote=] 空位置参数（有等号）", () => {
    expect(parseUbb("[quote=]内容[/quote]")).toEqual([tagPos("quote", [""], [txt("内容")])]);
  });

  test("[audio,title=测试] 仅有命名参数", () => {
    expect(parseUbb("[audio,title=曲名]http://x.com/a.mp3[/audio]")).toEqual([
      tagNamed("audio", { title: "曲名" }, [txt("http://x.com/a.mp3")]),
    ]);
  });
});

describe("特殊字符在文本中", () => {
  test("尖括号 < > 保持原样（parseUbb 不转义）", () => {
    expect(parseUbb("a < b > c")).toEqual([txt("a < b > c")]);
  });

  test("方括号前有反斜杠 \\[b] 不构成标签", () => {
    // [b] 仍然被解析为标签，反斜杠是普通文本
    // [b] 未关闭 → forceClose 降级为文本 "[b]"
    expect(parseUbb("\\[b]text")).toEqual([txt("\\"), txt("[b]"), txt("text")]);
  });

  test("只有左括号 [ 不构成标签", () => {
    expect(parseUbb("这不是[标签")).toEqual([txt("这不是[标签")]);
  });

  test("空方括号 [] 不构成标签", () => {
    expect(parseUbb("文本[]文本")).toEqual([txt("文本"), txt("[]"), txt("文本")]);
  });

  test("仅有斜杠 [/] 不构成结束标签", () => {
    // [/] 的 tagString = "/"，endMatch 匹配 /^\/(.+)$/ 需要至少一个字符
    expect(parseUbb("文本[/]文本")).toEqual([txt("文本"), txt("[/]"), txt("文本")]);
  });
});

describe("空标签和边界", () => {
  test("[b][/b] 多个空标签连续", () => {
    expect(parseUbb("[b][/b][i][/i][u][/u]")).toEqual([tag("b"), tag("i"), tag("u")]);
  });

  test("Text 模式空标签 [code][/code]", () => {
    expect(parseUbb("[code][/code]")).toEqual([tag("code", [])]);
  });

  test("嵌套空标签 [b][i][/i][/b]", () => {
    expect(parseUbb("[b][i][/i][/b]")).toEqual([tag("b", [tag("i")])]);
  });

  test("只有换行的纯文本", () => {
    expect(parseUbb("\n\n\n")).toEqual([txt("\n\n\n")]);
  });
});
