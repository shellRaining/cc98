import { describe, expect, test } from "vite-plus/test";
import { ubbToHtml, ubbToMarkdown } from "../src/index.ts";

const mixedPost = [
  "[quote=用户A][b]原帖[/b][/quote]",
  "[size=5][color=red]回复正文[/color][/size] [em01]",
  "[url=/topic/123]相关帖子[/url]",
  "[table][tr][th]姓名[/th][th]分数[/th][/tr][tr][td]张三[/td][td]90[/td][/tr][/table]",
  "[code]const answer = 42;[/code]",
].join("\n");

describe("UBB 导出端到端组合", () => {
  test("复杂帖子导出 Markdown 时保留可表达语义并降级样式", () => {
    const markdown = ubbToMarkdown(mixedPost);

    expect(markdown).toContain("> 用户A：**原帖**");
    expect(markdown).toContain("回复正文");
    expect(markdown).toContain("[相关帖子](/topic/123)");
    expect(markdown).toContain("| 姓名 | 分数 |");
    expect(markdown).toContain("`const answer = 42;`");
    expect(markdown).toContain("![经典表情 01](https://www.cc98.org/static/images/em/em01.gif)");
    expect(markdown).not.toContain("[em01]");
  });

  test("复杂帖子导出 HTML 时组合结构完整且文本安全", () => {
    const html = ubbToHtml(`${mixedPost}\n<script>alert(1)</script>`);

    expect(html).toContain("<blockquote>");
    expect(html).toContain("<strong>原帖</strong>");
    expect(html).toContain('<a href="/topic/123">相关帖子</a>');
    expect(html).toContain("<table>");
    expect(html).toContain("<code>const answer = 42;</code>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain("[em01]");
  });
});
