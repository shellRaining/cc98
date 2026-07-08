/**
 * UBB 导出器 E2E 测试：真实帖子的完整 Markdown/HTML 转换。
 *
 * 与单元测试（单个标签转换）不同，这里模拟 CC98 论坛中实际帖子的
 * 完整 UBB 文本，验证 ubbToMarkdown 和 ubbToHtml 在复杂混合场景下的
 * 端到端正确性。每个场景同时验证 Markdown 和 HTML 输出。
 */
import { describe, expect, test } from "vite-plus/test";
import { ubbToMarkdown, ubbToHtml } from "../src/index.ts";

describe("E2E 导出：富文本自我介绍帖", () => {
  const ubb = [
    "[b]大家好[/b]，我是新来的。[em01]",
    "",
    "[i]今天天气不错[/i]，分享一下我的[url=https://cc98.org]个人主页[/url]。",
    "",
    "[size=5][color=red]重要通知[/color][/size]",
  ].join("\n");

  test("ubbToMarkdown", () => {
    expect(ubbToMarkdown(ubb)).toBe(
      [
        "**大家好**，我是新来的。",
        "",
        "_今天天气不错_，分享一下我的[个人主页](https://cc98.org)。",
        "",
        "重要通知",
      ].join("\n"),
    );
  });

  test("ubbToHtml", () => {
    expect(ubbToHtml(ubb)).toBe(
      [
        "<strong>大家好</strong>，我是新来的。",
        "\n\n",
        '<em>今天天气不错</em>，分享一下我的<a href="https://cc98.org">个人主页</a>。',
        "\n\n",
        '<span style="font-size: 5pt"><span style="color: red">重要通知</span></span>',
      ].join(""),
    );
  });
});

describe("E2E 导出：代码分享帖", () => {
  const ubb = [
    "分享一下我的代码：",
    "",
    "[code]function hello() {",
    '  console.log("hello");',
    "}[/code]",
    "",
    "希望能帮到大家。",
  ].join("\n");

  test("ubbToMarkdown", () => {
    const FENCE = "```";
    expect(ubbToMarkdown(ubb)).toBe(
      [
        "分享一下我的代码：",
        "",
        FENCE,
        "function hello() {",
        '  console.log("hello");',
        "}",
        FENCE,
        "",
        "希望能帮到大家。",
      ].join("\n"),
    );
  });

  test("ubbToHtml", () => {
    expect(ubbToHtml(ubb)).toBe(
      [
        "分享一下我的代码：",
        "\n\n",
        "<pre><code>function hello() {\n  console.log(&quot;hello&quot;);\n}</code></pre>",
        "\n\n希望能帮到大家。",
      ].join(""),
    );
  });
});

describe("E2E 导出：嵌套引用帖", () => {
  const ubb = "[quote=用户A][b]原帖内容[/b][/quote]\n我的回复";

  test("ubbToMarkdown", () => {
    expect(ubbToMarkdown(ubb)).toBe("> 用户A：**原帖内容**\n我的回复");
  });

  test("ubbToHtml", () => {
    expect(ubbToHtml(ubb)).toBe(
      "<blockquote><cite>用户A：</cite><strong>原帖内容</strong></blockquote>\n我的回复",
    );
  });
});

describe("E2E 导出：图片视频分享帖", () => {
  const ubb =
    "[b]旅行照片[/b]\n[img]https://example.com/1.jpg[/img]\n[video]https://example.com/v.mp4[/video]";

  test("ubbToMarkdown", () => {
    expect(ubbToMarkdown(ubb)).toBe(
      "**旅行照片**\n![](https://example.com/1.jpg)\n[video](https://example.com/v.mp4)",
    );
  });

  test("ubbToHtml", () => {
    expect(ubbToHtml(ubb)).toBe(
      '<strong>旅行照片</strong>\n<img src="https://example.com/1.jpg" alt="">\n<video src="https://example.com/v.mp4" controls></video>',
    );
  });
});

describe("E2E 导出：站内链接综合帖", () => {
  const ubb = "感谢 [user=张三] 分享，参见 [topic=123]帖子[/topic]，来自 [board=456]板块[/board]。";

  test("ubbToMarkdown", () => {
    expect(ubbToMarkdown(ubb)).toBe(
      "感谢 @张三 分享，参见 [帖子](/topic/123)，来自 [板块](/board/456)。",
    );
  });

  test("ubbToHtml", () => {
    expect(ubbToHtml(ubb)).toBe(
      '感谢 <a href="/user/张三">@张三</a> 分享，参见 <a href="/topic/123">帖子</a>，来自 <a href="/board/456">板块</a>。',
    );
  });
});

describe("E2E 导出：表格帖", () => {
  const ubb =
    "[table][tr][th]姓名[/th][th]分数[/th][/tr][tr][td][b]张三[/b][/td][td][color=blue]90[/color][/td][/tr][/table]";

  test("ubbToMarkdown", () => {
    expect(ubbToMarkdown(ubb)).toBe("| 姓名 | 分数 |\n| --- | --- |\n| **张三** | 90 |");
  });

  test("ubbToHtml", () => {
    expect(ubbToHtml(ubb)).toBe(
      '<table><tr><th>姓名</th><th>分数</th></tr><tr><td><strong>张三</strong></td><td><span style="color: blue">90</span></td></tr></table>',
    );
  });
});
