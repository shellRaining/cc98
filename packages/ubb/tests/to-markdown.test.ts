/**
 * ubbToMarkdown 导出器单元测试。
 *
 * 转换规则设计依据：
 * - docs/exec-plans/completed/2026-07-08-ubb-migration.md 阶段 2 标签迁移清单。
 * - src/tags.ts 的标签模式表（recursive / text / empty / autoclose）。
 * - src/types.ts 的 AST 结构（positionals / named / children）。
 *
 * 分三类转换：
 * 1. Markdown 能直接表达的：b/i/del/url/img/quote/code/line。
 * 2. Markdown 无法表达的：剥除样式保留内容（u/size/color/font/align/left/
 *    center/right/english/cursor），表情和权限标签剥除为空字符串。
 * 3. 富媒体/站内语义降级：audio/mp3/video/bili/upload 降级为链接或地址，
 *    user/topic/board/pm 降级为 @提及或站内链接，math/m 保留 LaTeX 原文。
 *
 * 测试基于 AST 版正确行为编写，会先失败（当前 src/index.ts 是旧正则 PoC，
 * 无法处理嵌套与多数标签），等 AST 版实现后通过。
 *
 * 关键设计决策：
 * - 多行 code：内容含换行则输出围栏代码块 ```` ```\n{content}\n``` ````，
 *   不指定语言（UBB code 不携带语言信息）；单行输出行内代码 ` `{content}` `。
 * - 多行 quote：对内容按行拆分，每行加 `> ` 前缀，空行写成 `>`。
 */
import { describe, expect, test } from "vite-plus/test";
import { ubbToMarkdown } from "../src/index.ts";

/** 围栏代码块的三反引号。双引号字符串里反引号无需转义。 */
const FENCE = "```";

describe("基础文字样式", () => {
  test("[b]text[/b] 转加粗", () => {
    expect(ubbToMarkdown("[b]粗体[/b]")).toBe("**粗体**");
  });

  test("[i]text[/i] 转斜体", () => {
    expect(ubbToMarkdown("[i]斜体[/i]")).toBe("_斜体_");
  });

  test("[del]text[/del] 转删除线", () => {
    expect(ubbToMarkdown("[del]删除[/del]")).toBe("~~删除~~");
  });

  test("[b][i]嵌套[/i][/b] 两层递归组合", () => {
    expect(ubbToMarkdown("[b][i]嵌套[/i][/b]")).toBe("**_嵌套_**");
  });

  test("[b][i][del]三层[/del][/i][/b] 三层递归组合", () => {
    expect(ubbToMarkdown("[b][i][del]三层[/del][/i][/b]")).toBe("**_~~三层~~_**");
  });

  test("u/size/color/font/align 剥除样式保留内容", () => {
    expect(ubbToMarkdown("[u]下划线[/u]")).toBe("下划线");
    expect(ubbToMarkdown("[size=5]大字[/size]")).toBe("大字");
    expect(ubbToMarkdown("[color=red]红字[/color]")).toBe("红字");
    expect(ubbToMarkdown("[color=#ff0000]红字[/color]")).toBe("红字");
    expect(ubbToMarkdown("[font=宋体]正文[/font]")).toBe("正文");
    expect(ubbToMarkdown("[align=center]居中[/align]")).toBe("居中");
  });

  test("left/center/right/english/cursor 剥除样式保留内容", () => {
    expect(ubbToMarkdown("[left]左[/left]")).toBe("左");
    expect(ubbToMarkdown("[center]中[/center]")).toBe("中");
    expect(ubbToMarkdown("[right]右[/right]")).toBe("右");
    expect(ubbToMarkdown("[english]English[/english]")).toBe("English");
    expect(ubbToMarkdown("[cursor=pointer]悬停[/cursor]")).toBe("悬停");
  });

  test("[color=red][b]红粗[/b][/color] 剥除外层保留内层语义", () => {
    expect(ubbToMarkdown("[color=red][b]红粗[/b][/color]")).toBe("**红粗**");
  });

  test("[size=5][color=blue]内容[/color][/size] 嵌套剥除", () => {
    expect(ubbToMarkdown("[size=5][color=blue]内容[/color][/size]")).toBe("内容");
  });

  test("[b]a[/b]b 标签与文本互为兄弟节点", () => {
    expect(ubbToMarkdown("[b]a[/b]b")).toBe("**a**b");
  });
});

describe("链接和图片", () => {
  test("[url=addr]text[/url] 转链接", () => {
    expect(ubbToMarkdown("[url=https://cc98.org]CC98[/url]")).toBe("[CC98](https://cc98.org)");
  });

  test("[url]addr[/url] 无文字链接转尖括号 autolink", () => {
    expect(ubbToMarkdown("[url]https://cc98.org[/url]")).toBe("<https://cc98.org>");
  });

  test("[url=addr][/url] 空内容回退为 autolink", () => {
    expect(ubbToMarkdown("[url=https://cc98.org][/url]")).toBe("<https://cc98.org>");
  });

  test("[url=addr][b]text[/b][/url] 链接文字递归转换", () => {
    expect(ubbToMarkdown("[url=https://cc98.org][b]CC98[/b][/url]")).toBe(
      "[**CC98**](https://cc98.org)",
    );
  });

  test("[img]addr[/img] 转图片", () => {
    expect(ubbToMarkdown("[img]http://example.com/a.png[/img]")).toBe(
      "![](http://example.com/a.png)",
    );
  });

  test("[img=0]addr[/img] 位置参数不影响图片输出", () => {
    expect(ubbToMarkdown("[img=0]http://example.com/a.png[/img]")).toBe(
      "![](http://example.com/a.png)",
    );
  });

  test("[img,title=标题]addr[/img] 命名参数作图片 alt", () => {
    expect(ubbToMarkdown("[img,title=封面]http://example.com/a.png[/img]")).toBe(
      "![封面](http://example.com/a.png)",
    );
  });

  test("纯文本中嵌入链接和图片", () => {
    expect(
      ubbToMarkdown("看图 [img]http://x.com/1.png[/img] 和 [url=http://y.com]链接[/url]"),
    ).toBe("看图 ![](http://x.com/1.png) 和 [链接](http://y.com)");
  });
});

describe("引用和代码", () => {
  test("[code]单行[/code] 转行内代码", () => {
    expect(ubbToMarkdown("[code]console.log(1)[/code]")).toBe("`console.log(1)`");
  });

  test("[code]多行[/code] 转围栏代码块", () => {
    expect(ubbToMarkdown("[code]line1\nline2[/code]")).toBe(FENCE + "\nline1\nline2\n" + FENCE);
  });

  test("[quote]单行[/quote] 转引用", () => {
    expect(ubbToMarkdown("[quote]引用内容[/quote]")).toBe("> 引用内容");
  });

  test("[quote]多行[/quote] 每行加 > 前缀", () => {
    expect(ubbToMarkdown("[quote]第一行\n第二行[/quote]")).toBe("> 第一行\n> 第二行");
  });

  test("[quote][b]管理员[/b]说：[/quote] 引用内嵌套样式", () => {
    expect(ubbToMarkdown("[quote][b]管理员[/b]说：[/quote]")).toBe("> **管理员**说：");
  });

  test("[quote=大牛]内容[/quote] 保留来源作为归属", () => {
    expect(ubbToMarkdown("[quote=大牛]他说的话[/quote]")).toBe("> 大牛：他说的话");
  });

  test("[line] 转分割线，文本中嵌入时用换行分隔", () => {
    expect(ubbToMarkdown("[line]")).toBe("---");
    expect(ubbToMarkdown("上文[line]下文")).toBe("上文\n---\n下文");
  });
});

describe("Text 模式标签", () => {
  test("[md]内容[/md] 原样输出（含 UBB 字面量）", () => {
    expect(ubbToMarkdown("[md]**粗体**[/md]")).toBe("**粗体**");
    expect(ubbToMarkdown("[md][b]不递归[/b][/md]")).toBe("[b]不递归[/b]");
  });

  test("[noubb]普通文本原样，含特殊字符时转义", () => {
    expect(ubbToMarkdown("[noubb]普通文本[/noubb]")).toBe("普通文本");
    expect(ubbToMarkdown("[noubb][b]原始[/b][/noubb]")).toBe("\\[b\\]原始\\[/b\\]");
  });

  test("[audio]/[mp3] 降级为链接", () => {
    expect(ubbToMarkdown("[audio]http://example.com/a.mp3[/audio]")).toBe(
      "[audio](http://example.com/a.mp3)",
    );
    expect(ubbToMarkdown("[mp3]http://example.com/a.mp3[/mp3]")).toBe(
      "[mp3](http://example.com/a.mp3)",
    );
  });

  test("[video]/[bili] 降级为链接", () => {
    expect(ubbToMarkdown("[video]http://example.com/v.mp4[/video]")).toBe(
      "[video](http://example.com/v.mp4)",
    );
    expect(ubbToMarkdown("[bili]BV1xx911y7xz[/bili]")).toBe("[bili](BV1xx911y7xz)");
  });

  test("[upload]/[upload=ext] 降级为地址", () => {
    expect(ubbToMarkdown("[upload]http://example.com/f.zip[/upload]")).toBe(
      "http://example.com/f.zip",
    );
    expect(ubbToMarkdown("[upload=jpg]http://example.com/a.jpg[/upload]")).toBe(
      "http://example.com/a.jpg",
    );
  });

  test("[math]/[m] 保留 LaTeX 原文", () => {
    expect(ubbToMarkdown("[math]E=mc^2[/math]")).toBe("E=mc^2");
    expect(ubbToMarkdown("[m]x^2[/m]")).toBe("x^2");
  });

  test("[math]内部 UBB 字面量保留原样", () => {
    expect(ubbToMarkdown("[math][b]不递归[/b][/math]")).toBe("[b]不递归[/b]");
  });
});

describe("表情和权限标签", () => {
  test("[ac01] 表情剥除为空字符串", () => {
    expect(ubbToMarkdown("[ac01]")).toBe("");
  });

  test("[ms01]/[em01] 表情剥除为空字符串", () => {
    expect(ubbToMarkdown("[ms01]")).toBe("");
    expect(ubbToMarkdown("[em01]")).toBe("");
  });

  test("[cc9801]/[tb01]/[a:001]/[c:003] 表情剥除为空字符串", () => {
    expect(ubbToMarkdown("[cc9801]")).toBe("");
    expect(ubbToMarkdown("[tb01]")).toBe("");
    expect(ubbToMarkdown("[a:001]")).toBe("");
    expect(ubbToMarkdown("[c:003]")).toBe("");
  });

  test("[needreply]/[posteronly]/[allowviewer] 权限标签剥除为空字符串", () => {
    expect(ubbToMarkdown("[needreply]")).toBe("");
    expect(ubbToMarkdown("[posteronly]")).toBe("");
    expect(ubbToMarkdown("[allowviewer]")).toBe("");
  });

  test("表情嵌入文本与连续表情剥除", () => {
    expect(ubbToMarkdown("a[ac01]b")).toBe("ab");
    expect(ubbToMarkdown("[ac01][ac02][em01]")).toBe("");
  });
});

describe("站内链接", () => {
  test("[user=用户名] / [user]用户名[/user] 转 @提及", () => {
    expect(ubbToMarkdown("[user=张三]")).toBe("@张三");
    expect(ubbToMarkdown("[user]张三[/user]")).toBe("@张三");
  });

  test("[topic=ID] 无标题转站内帖子链接", () => {
    expect(ubbToMarkdown("[topic=123]")).toBe("[帖子 123](/topic/123)");
  });

  test("[topic=ID]标题[/topic] 带标题转站内帖子链接", () => {
    expect(ubbToMarkdown("[topic=123]帖子标题[/topic]")).toBe("[帖子标题](/topic/123)");
  });

  test("[board=ID] 无名与带名转站内板块链接", () => {
    expect(ubbToMarkdown("[board=456]")).toBe("[板块 456](/board/456)");
    expect(ubbToMarkdown("[board=456]板块名称[/board]")).toBe("[板块名称](/board/456)");
  });

  test("[pm=用户名] 转 @提及", () => {
    expect(ubbToMarkdown("[pm=李四]")).toBe("@李四");
  });

  test("站内链接嵌入文本", () => {
    expect(ubbToMarkdown("感谢 [user=张三] 的分享，参见 [topic=123]帖子[/topic]")).toBe(
      "感谢 @张三 的分享，参见 [帖子](/topic/123)",
    );
  });
});

describe("表格", () => {
  test("单行表格：补充表头分隔行", () => {
    expect(ubbToMarkdown("[table][tr][td]A[/td][td]B[/td][/tr][/table]")).toBe(
      "| A | B |\n| --- | --- |",
    );
  });

  test("多行表格：首行作表头，后续作数据行", () => {
    const input =
      "[table][tr][th]姓名[/th][th]分数[/th][/tr][tr][td]张三[/td][td]90[/td][/tr][/table]";
    expect(ubbToMarkdown(input)).toBe("| 姓名 | 分数 |\n| --- | --- |\n| 张三 | 90 |");
  });

  test("表格单元格内嵌套样式递归转换", () => {
    const input = "[table][tr][td][b]名称[/b][/td][td][color=blue]值[/color][/td][/tr][/table]";
    expect(ubbToMarkdown(input)).toBe("| **名称** | 值 |\n| --- | --- |");
  });
});

describe("混合场景与容错", () => {
  test("富文本混合：加粗 + 链接 + 图片 + 表情", () => {
    expect(
      ubbToMarkdown(
        "[b]大家好[/b]，分享 [url=https://cc98.org]主页[/url] 和 [img]http://x.com/a.png[/img][ac01]",
      ),
    ).toBe("**大家好**，分享 [主页](https://cc98.org) 和 ![](http://x.com/a.png)");
  });

  test("完整段落：样式 + 站内链接 + 分割线 + 表情", () => {
    expect(
      ubbToMarkdown("[b]标题[/b]\n\n[i]正文[/i]，详见 [topic=99]这里[/topic]。[line][ac01]"),
    ).toBe("**标题**\n\n_正文_，详见 [这里](/topic/99)。\n---");
  });

  test("未闭合标签容错：[b] 降级为字面量", () => {
    expect(ubbToMarkdown("[b]没有闭合")).toBe("[b]没有闭合");
  });

  test("未知标签与孤立结束标签保留原始字面量", () => {
    expect(ubbToMarkdown("[foo]内容[/foo]")).toBe("[foo]内容[/foo]");
    expect(ubbToMarkdown("孤立[/b]")).toBe("孤立[/b]");
  });

  test("空字符串与纯文本原样输出", () => {
    expect(ubbToMarkdown("")).toBe("");
    expect(ubbToMarkdown("hello world")).toBe("hello world");
  });
});
