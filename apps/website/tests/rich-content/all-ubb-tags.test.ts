import {
  UBB_REGEX_TAG_FAMILIES,
  UBB_STATIC_TAG_NAMES,
  type UbbRegexTagFamily,
  type UbbStaticTagName,
} from "@cc98/ubb";
import { createSSRApp, h } from "vue";
import { describe, expect, test } from "vite-plus/test";
import { renderToString } from "vue/server-renderer";
import ContentRenderer from "../../src/components/rich-content/ContentRenderer.vue";

async function renderContent(content: string) {
  return renderToString(
    createSSRApp({
      render: () => h(ContentRenderer, { content, type: "ubb" }),
    }),
  );
}

type StaticCase = {
  covers: UbbStaticTagName[];
  content: string;
  assertions: Array<string | RegExp>;
};

const staticCases: StaticCase[] = [
  {
    covers: ["b", "i", "u", "del", "english"],
    content: "[b]粗[/b][i]斜[/i][u]线[/u][del]删[/del][english]EN[/english]",
    assertions: ["<strong>粗</strong>", "<em>斜</em>", "<u>线</u>", "<s>删</s>", /Arial/],
  },
  {
    covers: ["size", "color", "font", "cursor"],
    content:
      "[size=12]字号[/size][color=red]颜色[/color][font=serif]字体[/font][cursor=help]光标[/cursor]",
    assertions: [/font-size:12pt/, /color:red/, /font-family:serif/, /cursor:help/],
  },
  {
    covers: ["left", "center", "right", "align"],
    content: "[left]左[/left][center]中[/center][right]右[/right][align=center]中2[/align]",
    assertions: [/text-align:left/, /text-align:center/, /text-align:right/],
  },
  {
    covers: ["url", "user", "topic", "board", "pm"],
    content:
      "[url=/topic/1]链接[/url][user=测试用户][topic=123]主题[/topic][board=456]版面[/board][pm=测试用户]",
    assertions: ['href="/topic/1"', "@测试用户", 'href="/topic/123"', 'href="/list/456"'],
  },
  {
    covers: ["table", "tr", "td", "th"],
    content: "[table][tr][th]表头[/th][td=2,3]单元格[/td][/tr][/table]",
    assertions: ["<table", "<tr", "<th", /rowspan="2"/, /colspan="3"/],
  },
  {
    covers: ["quote", "quotex"],
    content: "[quote=甲]引用[/quote][quotex=乙]扩展引用[/quotex]",
    assertions: ["<blockquote", "甲：", "乙："],
  },
  {
    covers: ["code", "md", "noubb"],
    content: "[code][b]代码[/b][/code][md]**粗体**[/md][noubb][i]字面量[/i][/noubb]",
    assertions: ["ubb-code-block", "[b]代码[/b]", "<strong>粗体</strong>", "[i]字面量[/i]"],
  },
  {
    covers: ["img", "audio", "mp3", "video", "upload", "bili"],
    content:
      "[img]https://example.com/a.png[/img][audio]https://example.com/a.mp3[/audio][mp3]https://example.com/b.mp3[/mp3][video]https://example.com/a.mp4[/video][upload=txt]https://example.com/a.txt[/upload][bili]BV1xx411c7mD[/bili]",
    assertions: ["<img", /aplayer/g, "dplayer", "download", "player.bilibili.com"],
  },
  {
    covers: ["math", "m"],
    content: "[math]E=mc^2[/math][m]x_1[/m]",
    assertions: ["katex-display", "katex"],
  },
  {
    covers: ["line", "needreply", "posteronly", "allowviewer"],
    content: "[line][needreply][posteronly][allowviewer]",
    assertions: ["<hr", "回复后", "主题帖作者", "特定用户可见"],
  },
];

const regexCases: Array<{
  family: UbbRegexTagFamily;
  tag: string;
  sourcePart: string;
}> = [
  { family: "em", tag: "em01", sourcePart: "/em/" },
  { family: "ac", tag: "ac01", sourcePart: "/ac/" },
  { family: "ms", tag: "ms01", sourcePart: "/ms/" },
  { family: "mahjong", tag: "a:008", sourcePart: "/mahjong/" },
  { family: "cc98", tag: "cc9801", sourcePart: "/CC98/" },
  { family: "tb", tag: "tb01", sourcePart: "/tb/" },
];

describe("全部 UBB 标签渲染契约", () => {
  test("静态标签样本覆盖解析器导出的完整清单", () => {
    expect(staticCases.flatMap((item) => item.covers).sort()).toEqual(
      [...UBB_STATIC_TAG_NAMES].sort(),
    );
  });

  test.each(staticCases)("渲染静态标签族 $covers", async ({ content, assertions }) => {
    const html = await renderContent(content);
    for (const assertion of assertions) {
      if (typeof assertion === "string") expect(html).toContain(assertion);
      else expect(html).toMatch(assertion);
    }
  });

  test("正则标签样本覆盖解析器导出的完整家族", () => {
    expect(regexCases.map((item) => item.family).sort()).toEqual(
      [...UBB_REGEX_TAG_FAMILIES].sort(),
    );
  });

  test.each(regexCases)("渲染正则标签族 $family", async ({ tag, sourcePart }) => {
    const html = await renderContent(`[${tag}]`);
    expect(html).toContain("<img");
    expect(html).toContain(sourcePart);
    expect(html).not.toContain(`[${tag}]`);
  });
});
