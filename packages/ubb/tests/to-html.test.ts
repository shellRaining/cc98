/**
 * ubbToHtml 导出器单元测试。
 *
 * 转换规则设计依据：
 * - 任务说明的 HTML 转换规则表（文字样式 / 链接图片 / 引用代码 / 表格 /
 *   Text 模式 / 站内链接 / 表情权限）。
 * - src/tags.ts 标签模式表（recursive / text / empty / autoclose）决定 AST 结构。
 * - src/types.ts AST 节点结构（positionals / named / children）。
 *
 * 安全净化策略（实现者依据）：
 * 1. 文本节点转义：所有 AST 文本节点输出前转义 HTML 特殊字符，
 *    & → &amp;、< → &lt;、> → &gt;、" → &quot;。
 *    转义顺序必须先 & 后其它，避免 &lt; 中的 & 被二次转义成 &amp;lt;。
 *    单引号 ' 不转义（HTML 双引号属性内安全，文本节点内无需转义）。
 *    方括号 [ ] 不是 HTML 特殊字符，不转义（容错降级时保留字面量）。
 * 2. URL 协议白名单：href / src 只允许 http://、https://、mailto:、/（相对路径），
 *    其余协议（javascript:、data: 等）一律拒绝，URL 替换为 "#"，
 *    链接文字和 img 的 alt 保留，避免 XSS 同时不破坏内容结构。
 * 3. 属性值转义：输出到双引号属性内的值（href、src、style、colspan、rowspan）
 *    需转义 " & <，防止跳出属性边界注入。
 * 4. Text 模式标签（code / noubb / md / math 等）内部整体作单个文本节点，
 *    不递归 UBB 标签，内容仍按规则 1 转义 HTML 字符。
 *
 * ubbToHtml 尚未实现，测试会先失败，等实现后通过。
 */
import { describe, expect, test } from "vite-plus/test";
import { ubbToHtml } from "../src/index.ts";

describe("基础文字样式", () => {
  test("[b]text[/b] 转 strong", () => {
    expect(ubbToHtml("[b]粗体[/b]")).toBe("<strong>粗体</strong>");
  });

  test("[i]text[/i] 转 em", () => {
    expect(ubbToHtml("[i]斜体[/i]")).toBe("<em>斜体</em>");
  });

  test("[u]text[/u] 转 u", () => {
    expect(ubbToHtml("[u]下划线[/u]")).toBe("<u>下划线</u>");
  });

  test("[del]text[/del] 转 s", () => {
    expect(ubbToHtml("[del]删除[/del]")).toBe("<s>删除</s>");
  });

  test("[b][i]两层嵌套[/i][/b] 递归转换", () => {
    expect(ubbToHtml("[b][i]嵌套[/i][/b]")).toBe("<strong><em>嵌套</em></strong>");
  });

  test("[b][i][del]三层嵌套[/del][/i][/b] 递归转换", () => {
    expect(ubbToHtml("[b][i][del]三层[/del][/i][/b]")).toBe(
      "<strong><em><s>三层</s></em></strong>",
    );
  });

  test("[size]/[color]/[font]/[align] 转 span/div 带 style", () => {
    expect(ubbToHtml("[size=5]大字[/size]")).toBe(`<span style="font-size: 5pt">大字</span>`);
    expect(ubbToHtml("[color=red]红字[/color]")).toBe(`<span style="color: red">红字</span>`);
    expect(ubbToHtml("[color=#ff0000]红字[/color]")).toBe(
      `<span style="color: #ff0000">红字</span>`,
    );
    expect(ubbToHtml("[font=宋体]正文[/font]")).toBe(`<span style="font-family: 宋体">正文</span>`);
    expect(ubbToHtml("[align=center]居中[/align]")).toBe(
      `<div style="text-align: center">居中</div>`,
    );
  });

  test("[left]/[center]/[right]/[english]/[cursor] 转 div/span", () => {
    expect(ubbToHtml("[left]左[/left]")).toBe(`<div style="text-align: left">左</div>`);
    expect(ubbToHtml("[center]中[/center]")).toBe(`<div style="text-align: center">中</div>`);
    expect(ubbToHtml("[right]右[/right]")).toBe(`<div style="text-align: right">右</div>`);
    expect(ubbToHtml("[english]English[/english]")).toBe(
      `<span style="font-family: Arial">English</span>`,
    );
    expect(ubbToHtml("[cursor=pointer]悬停[/cursor]")).toBe(
      `<span style="cursor: pointer">悬停</span>`,
    );
  });

  test("[color=red][b]红粗[/b][/color] 外层 span 内层递归", () => {
    expect(ubbToHtml("[color=red][b]红粗[/b][/color]")).toBe(
      `<span style="color: red"><strong>红粗</strong></span>`,
    );
  });

  test("[b]a[/b]b 标签与文本互为兄弟节点", () => {
    expect(ubbToHtml("[b]a[/b]b")).toBe("<strong>a</strong>b");
  });
});

describe("链接和图片", () => {
  test("[url=addr]text[/url] 转链接", () => {
    expect(ubbToHtml("[url=https://cc98.org]CC98[/url]")).toBe(
      `<a href="https://cc98.org">CC98</a>`,
    );
  });

  test("[url]addr[/url] 无文字链接，地址作文字", () => {
    expect(ubbToHtml("[url]https://cc98.org[/url]")).toBe(
      `<a href="https://cc98.org">https://cc98.org</a>`,
    );
  });

  test("[url=addr][/url] 空内容回退为地址作文字", () => {
    expect(ubbToHtml("[url=https://cc98.org][/url]")).toBe(
      `<a href="https://cc98.org">https://cc98.org</a>`,
    );
  });

  test("[url=addr][b]text[/b][/url] 链接文字递归转换", () => {
    expect(ubbToHtml("[url=https://cc98.org][b]CC98[/b][/url]")).toBe(
      `<a href="https://cc98.org"><strong>CC98</strong></a>`,
    );
  });

  test("[img]addr[/img] 转图片（positionals 不影响输出）", () => {
    expect(ubbToHtml("[img]http://example.com/a.png[/img]")).toBe(
      `<img src="http://example.com/a.png" alt="">`,
    );
    expect(ubbToHtml("[img=1]http://example.com/a.png[/img]")).toBe(
      `<img src="http://example.com/a.png" alt="">`,
    );
  });

  test("[img,title=标题]addr[/img] 命名参数作 alt", () => {
    expect(ubbToHtml("[img,title=封面]http://example.com/a.png[/img]")).toBe(
      `<img src="http://example.com/a.png" alt="封面">`,
    );
  });

  test("纯文本中嵌入链接和图片", () => {
    expect(ubbToHtml("看图 [img]http://x.com/1.png[/img] 和 [url=http://y.com]链接[/url]")).toBe(
      `看图 <img src="http://x.com/1.png" alt=""> 和 <a href="http://y.com">链接</a>`,
    );
  });
});

describe("引用和代码", () => {
  test("[code] 转 pre/code（单行/多行均保留结构）", () => {
    expect(ubbToHtml("[code]console.log(1)[/code]")).toBe(`<pre><code>console.log(1)</code></pre>`);
    expect(ubbToHtml("[code]line1\nline2[/code]")).toBe(`<pre><code>line1\nline2</code></pre>`);
  });

  test("[code] 内容中 HTML 字符被转义，不执行", () => {
    expect(ubbToHtml("[code]<script>alert(1)</script>[/code]")).toBe(
      `<pre><code>&lt;script&gt;alert(1)&lt;/script&gt;</code></pre>`,
    );
  });

  test("[quote]text[/quote] 转 blockquote（quote/quotex 一致）", () => {
    expect(ubbToHtml("[quote]引用内容[/quote]")).toBe(`<blockquote>引用内容</blockquote>`);
    expect(ubbToHtml("[quotex]内容[/quotex]")).toBe(`<blockquote>内容</blockquote>`);
  });

  test("[quote=src]text[/quote] 保留来源作为 cite", () => {
    expect(ubbToHtml("[quote=大牛]他说的话[/quote]")).toBe(
      `<blockquote><cite>大牛：</cite>他说的话</blockquote>`,
    );
  });

  test("[quote][b]管理员[/b]说：[/quote] 引用内嵌套样式递归", () => {
    expect(ubbToHtml("[quote][b]管理员[/b]说：[/quote]")).toBe(
      `<blockquote><strong>管理员</strong>说：</blockquote>`,
    );
  });

  test("[line] 转 hr", () => {
    expect(ubbToHtml("[line]")).toBe(`<hr>`);
  });
});

describe("表格", () => {
  test("单行表格", () => {
    expect(ubbToHtml("[table][tr][td]A[/td][td]B[/td][/tr][/table]")).toBe(
      `<table><tr><td>A</td><td>B</td></tr></table>`,
    );
  });

  test("多行表格 th + td", () => {
    const input =
      "[table][tr][th]姓名[/th][th]分数[/th][/tr][tr][td]张三[/td][td]90[/td][/tr][/table]";
    expect(ubbToHtml(input)).toBe(
      `<table><tr><th>姓名</th><th>分数</th></tr><tr><td>张三</td><td>90</td></tr></table>`,
    );
  });

  test("[td=2,3] 转 colspan 和 rowspan", () => {
    expect(ubbToHtml("[table][tr][td=2,3]内容[/td][/tr][/table]")).toBe(
      `<table><tr><td colspan="2" rowspan="3">内容</td></tr></table>`,
    );
  });

  test("表格单元格内嵌套样式递归转换", () => {
    const input = "[table][tr][td][b]名称[/b][/td][td][color=blue]值[/color][/td][/tr][/table]";
    expect(ubbToHtml(input)).toBe(
      `<table><tr><td><strong>名称</strong></td><td><span style="color: blue">值</span></td></tr></table>`,
    );
  });
});

describe("Text 模式标签", () => {
  test("[md] 转 div.ubb-md，内部 HTML 字符转义、UBB 字面量保留", () => {
    expect(ubbToHtml("[md]**粗体**[/md]")).toBe(`<div class="ubb-md">**粗体**</div>`);
    expect(ubbToHtml("[md][b]不递归[/b][/md]")).toBe(`<div class="ubb-md">[b]不递归[/b]</div>`);
    expect(ubbToHtml("[md]<em>x</em>[/md]")).toBe(
      `<div class="ubb-md">&lt;em&gt;x&lt;/em&gt;</div>`,
    );
  });

  test("[noubb] 内容原样输出（HTML 字符转义，UBB 字面量保留）", () => {
    expect(ubbToHtml("[noubb]普通文本[/noubb]")).toBe("普通文本");
    expect(ubbToHtml("[noubb][b]原始[/b][/noubb]")).toBe("[b]原始[/b]");
    expect(ubbToHtml("[noubb]<b>x</b>[/noubb]")).toBe("&lt;b&gt;x&lt;/b&gt;");
  });

  test("[audio]/[mp3] 转 audio", () => {
    expect(ubbToHtml("[audio]http://example.com/a.mp3[/audio]")).toBe(
      `<audio src="http://example.com/a.mp3" controls></audio>`,
    );
    expect(ubbToHtml("[mp3]http://example.com/a.mp3[/mp3]")).toBe(
      `<audio src="http://example.com/a.mp3" controls></audio>`,
    );
  });

  test("[video]addr[/video] 转 video", () => {
    expect(ubbToHtml("[video]http://example.com/v.mp4[/video]")).toBe(
      `<video src="http://example.com/v.mp4" controls></video>`,
    );
  });

  test("[bili]id[/bili] 转 B 站链接", () => {
    expect(ubbToHtml("[bili]BV1xx911y7xz[/bili]")).toBe(
      `<a href="https://www.bilibili.com/video/BV1xx911y7xz">bili:BV1xx911y7xz</a>`,
    );
  });

  test("[upload]/[upload=ext]addr[/upload] 转下载链接", () => {
    expect(ubbToHtml("[upload]http://example.com/f.zip[/upload]")).toBe(
      `<a href="http://example.com/f.zip">下载文件</a>`,
    );
    expect(ubbToHtml("[upload=jpg]http://example.com/a.jpg[/upload]")).toBe(
      `<a href="http://example.com/a.jpg">下载文件</a>`,
    );
  });

  test("[math]/[m] 转 span.ubb-math，内部 UBB 字面量保留", () => {
    expect(ubbToHtml("[math]E=mc^2[/math]")).toBe(`<span class="ubb-math">E=mc^2</span>`);
    expect(ubbToHtml("[m]x^2[/m]")).toBe(`<span class="ubb-math">x^2</span>`);
    expect(ubbToHtml("[math][b]不递归[/b][/math]")).toBe(
      `<span class="ubb-math">[b]不递归[/b]</span>`,
    );
  });
});

describe("站内链接", () => {
  test("[user=name] / [user]name[/user] 转 @用户链接", () => {
    expect(ubbToHtml("[user=张三]")).toBe(`<a href="/user/张三">@张三</a>`);
    expect(ubbToHtml("[user]张三[/user]")).toBe(`<a href="/user/张三">@张三</a>`);
  });

  test("[topic=ID] 转站内帖子链接（无标题用默认，有标题用内容）", () => {
    expect(ubbToHtml("[topic=123]")).toBe(`<a href="/topic/123">帖子 123</a>`);
    expect(ubbToHtml("[topic=123]帖子标题[/topic]")).toBe(`<a href="/topic/123">帖子标题</a>`);
  });

  test("[board=ID] / [board=ID]name[/board] 转站内板块链接", () => {
    expect(ubbToHtml("[board=456]")).toBe(`<a href="/board/456">板块 456</a>`);
    expect(ubbToHtml("[board=456]板块名称[/board]")).toBe(`<a href="/board/456">板块名称</a>`);
  });

  test("[pm=name] 转 span.ubb-pm", () => {
    expect(ubbToHtml("[pm=李四]")).toBe(`<span class="ubb-pm">@李四</span>`);
  });

  test("站内链接嵌入文本", () => {
    expect(ubbToHtml("感谢 [user=张三] 的分享，参见 [topic=123]帖子[/topic]")).toBe(
      `感谢 <a href="/user/张三">@张三</a> 的分享，参见 <a href="/topic/123">帖子</a>`,
    );
  });
});

describe("表情和权限标签", () => {
  test("[ac01]/[ms01]/[em01] 表情剥除为空字符串", () => {
    expect(ubbToHtml("[ac01]")).toBe("");
    expect(ubbToHtml("[ms01]")).toBe("");
    expect(ubbToHtml("[em01]")).toBe("");
  });

  test("[cc9801]/[tb01]/[a:001]/[c:003] 表情剥除为空字符串", () => {
    expect(ubbToHtml("[cc9801]")).toBe("");
    expect(ubbToHtml("[tb01]")).toBe("");
    expect(ubbToHtml("[a:001]")).toBe("");
    expect(ubbToHtml("[c:003]")).toBe("");
  });

  test("[needreply]/[posteronly]/[allowviewer] 权限标签剥除为空字符串", () => {
    expect(ubbToHtml("[needreply]")).toBe("");
    expect(ubbToHtml("[posteronly]")).toBe("");
    expect(ubbToHtml("[allowviewer]")).toBe("");
  });

  test("表情嵌入文本剥除，连续表情全剥除", () => {
    expect(ubbToHtml("a[ac01]b")).toBe("ab");
    expect(ubbToHtml("[ac01][ac02][em01]")).toBe("");
  });
});

describe("安全和容错", () => {
  test('文本中 HTML 特殊字符转义：< > & "', () => {
    expect(ubbToHtml(`a < b & c > "d"`)).toBe(`a &lt; b &amp; c &gt; &quot;d&quot;`);
    expect(ubbToHtml("1 < 2 && 3 > 0")).toBe("1 &lt; 2 &amp;&amp; 3 &gt; 0");
  });

  test("URL 协议白名单：javascript: 被拒绝，URL 替换为 #", () => {
    expect(ubbToHtml("[url=javascript:alert(1)]点我[/url]")).toBe(`<a href="#">点我</a>`);
    expect(ubbToHtml("[img]javascript:alert(1)[/img]")).toBe(`<img src="#" alt="">`);
  });

  test("URL 协议白名单：相对路径和 mailto 允许", () => {
    expect(ubbToHtml("[url=/topic/123]帖子[/url]")).toBe(`<a href="/topic/123">帖子</a>`);
    expect(ubbToHtml("[url=mailto:a@b.com]邮件[/url]")).toBe(`<a href="mailto:a@b.com">邮件</a>`);
  });

  test("URL 属性值中的 & 被转义，不破坏属性边界", () => {
    expect(ubbToHtml("[url=http://x.com?a=1&b=2]链接[/url]")).toBe(
      `<a href="http://x.com?a=1&amp;b=2">链接</a>`,
    );
  });

  test("未闭合标签降级为字面量", () => {
    expect(ubbToHtml("[b]没有闭合")).toBe("[b]没有闭合");
  });

  test("未知标签与孤立结束标签保留原始字面量", () => {
    expect(ubbToHtml("[foo]内容[/foo]")).toBe("[foo]内容[/foo]");
    expect(ubbToHtml("孤立[/b]")).toBe("孤立[/b]");
  });

  test("空字符串与纯文本原样输出", () => {
    expect(ubbToHtml("")).toBe("");
    expect(ubbToHtml("hello world")).toBe("hello world");
  });
});
