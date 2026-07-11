import { createSSRApp, h } from "vue";
import { describe, expect, test } from "vite-plus/test";
import { renderToString } from "vue/server-renderer";
import ContentRenderer from "../../src/components/rich-content/ContentRenderer.vue";

async function renderContent(
  content: string,
  type: "ubb" | "markdown" = "ubb",
  options: Record<string, unknown> = {},
) {
  return renderToString(
    createSSRApp({
      render: () => h(ContentRenderer, { content, type, options }),
    }),
  );
}

describe("ContentRenderer", () => {
  test("历史引用链拉平为同级引用，避免深层缩进", async () => {
    const html = await renderContent("[quote]外层[quote]中层[quote]内层[/quote][/quote][/quote]");
    expect(html.match(/<blockquote/g)).toHaveLength(3);
    expect(html).not.toMatch(/<blockquote[^>]*>(?:(?!<\/blockquote>)[\s\S])*<blockquote/);
    expect(html.indexOf("内层")).toBeLessThan(html.indexOf("中层"));
    expect(html.indexOf("中层")).toBeLessThan(html.indexOf("外层"));
  });

  test("图片计数只在一次渲染中累计，并在下次渲染重置", async () => {
    const content = "[img]https://example.com/1.png[/img][img]https://example.com/2.png[/img]";
    const first = await renderContent(content, "ubb", { maxImageCount: 1 });
    const second = await renderContent("[img]https://example.com/3.png[/img]", "ubb", {
      maxImageCount: 1,
    });
    expect(first.match(/<img/g)).toHaveLength(1);
    expect(first).toContain("https://example.com/2.png");
    expect(second.match(/<img/g)).toHaveLength(1);
  });

  test("关闭表情后保留原始标签且权限提示不吞相邻内容", async () => {
    const html = await renderContent("前[em01][posteronly=1]后", "ubb", {
      allowEmotion: false,
    });
    expect(html).toContain("前[em01]");
    expect(html).toContain("后");
    expect(html).toContain("您是主题帖作者");
  });

  test("内嵌 Markdown 开关不影响顶层 Markdown", async () => {
    const embedded = await renderContent("[md]**加粗**[/md]", "ubb", {
      allowEmbeddedMarkdown: false,
    });
    const topLevel = await renderContent("**加粗**", "markdown", {
      allowEmbeddedMarkdown: false,
    });
    expect(embedded).toContain("**加粗**");
    expect(embedded).not.toContain("<strong>");
    expect(topLevel).toContain("<strong>加粗</strong>");
  });

  test("Markdown 原始 HTML 和危险 URL 不进入可执行输出", async () => {
    const html = await renderContent(
      "<script>alert(1)</script> [危险](javascript:alert(1)) ![图](data:text/html,x)",
      "markdown",
    );
    expect(html).not.toContain("<script>");
    expect(html).not.toContain('href="javascript:');
    expect(html).not.toContain('src="data:');
    expect(html).toContain("&lt;script&gt;");
  });
});
