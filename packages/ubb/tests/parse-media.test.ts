/**
 * 调研摘要（来源：Forum/Ubb/ 下各 handler + Core.tsx）
 *
 * 链接类：
 * - [url] / [url=地址]：URLTagHandler，extends RecursiveTagHandler，tagMode=Recursive。
 *   handler 用 tagData.value('url')（即 positionals[0]）取链接地址，无位置参数时回退到 innerContent。
 *   故 [url]地址[/url] 与 [url=地址]文字[/url] 均合法，内容为链接文字，允许嵌套子标签。
 *
 * 媒体类（均为 TextTagHandler；老代码 getTagMode 未覆盖、默认 Recursive，但其内容是 URL，
 *   本组按语义 AST 有意断言 Text 模式——内部不递归，内容作为单个文本节点，与 [math] 处理一致。
 *   这不是 Core.tsx segment 行为的逐字复刻，而是把渲染层 getContentText() 的最终文本语义
 *   提前到解析层表达）：
 * - [img] / [img=数字] / [img=数字,title=标题]：ImageTagHandler。
 *   内容=图片地址；positionals[0]（value('img')）=0 或缺省=默认显示，1=默认不显示；
 *   命名参数 title=图片标题。引号包裹的 title 值在解析时被剥离。
 * - [audio] 与 [mp3]（同一 handler 支持两个标签名）：AudioTagHandler。
 *   内容=音频地址；命名参数 title=曲目名。handler 不使用位置参数。
 * - [video]：VideoTagHandler。内容=视频地址（含 .m3u8）。无参数语义。
 * - [upload] / [upload=扩展名]：UploadTagHandler。
 *   内容=文件地址；positionals[0]=文件扩展名（jpg/png/pdf 等），决定渲染为图片或下载链接。
 *   老代码另有第二位置参数 [upload=jpg,1] 控制默认显示，新 AST positionals 数组可完整表达，
 *   本测试暂仅覆盖单位置参数形式，双参数场景待补充（见 review 结论）。
 * - [bili]：BiliTagHandler。内容=av号/BV号/B站URL；positionals[0]（value('bili')）=分P数（默认1）。
 *   注：任务描述写作 [bili=av号或bv号]，但 handler 实际以 innerContent 为视频标识、
 *   positionals[0] 为分P数，本测试按代码行为断言。
 *
 * 文本处理类（非方括号标签，parseUbb 不处理，保持纯文本节点）：
 * - UrlTextHandler：正则匹配 https?/ftp/file 协议 URL，自动加链接（受 autoDetectUrl 选项控制）。
 * - UrlTextHandler2：正则匹配裸域名（cc98.org 等），自动补 http://。
 *   两者均属文本处理器，纯 URL/域名文本在 parseUbb 阶段保持为 text 节点，不在方括号解析范围。
 *
 * 通用约束：tag 名一律小写；mp3 与 audio 为同一 handler 的两个标签名，均按原样小写保留。
 * 注意：命名标签大小写不敏感是新解析器的宽松兼容行为；原 Core.tsx 的具名 handler 查找大小写敏感。
 */
import { describe, expect, test } from "vite-plus/test";
import { parseUbb } from "../src/index.ts";
import { txt, tag, tagPos, tagNamed, tagBoth } from "./helpers.ts";

describe("[url] 标签（Recursive）", () => {
  test("[url]地址[/url] 内容形式，地址作为子文本", () => {
    expect(parseUbb("[url]https://cc98.org[/url]")).toEqual([
      tag("url", [txt("https://cc98.org")]),
    ]);
  });

  test("[url=地址]文字[/url] positionals[0] 为地址，内容为链接文字", () => {
    expect(parseUbb("[url=https://cc98.org]CC98[/url]")).toEqual([
      tagPos("url", ["https://cc98.org"], [txt("CC98")]),
    ]);
  });

  test("[url=地址][/url] positionals[0] 存在但内容为空", () => {
    expect(parseUbb("[url=https://cc98.org][/url]")).toEqual([
      tagPos("url", ["https://cc98.org"], []),
    ]);
  });

  test("[url][/url] 空内容且无参数", () => {
    expect(parseUbb("[url][/url]")).toEqual([tag("url", [])]);
  });

  test("[url=地址][b]文字[/b][/url] Recursive 模式允许嵌套子标签", () => {
    expect(parseUbb("[url=https://cc98.org][b]CC98[/b][/url]")).toEqual([
      tagPos("url", ["https://cc98.org"], [tag("b", [txt("CC98")])]),
    ]);
  });

  test("文本中嵌入 url，前后文本为兄弟节点", () => {
    expect(parseUbb("点击 [url=https://cc98.org]这里[/url] 查看")).toEqual([
      txt("点击 "),
      tagPos("url", ["https://cc98.org"], [txt("这里")]),
      txt(" 查看"),
    ]);
  });
});

describe("[img] 标签（Text 模式）", () => {
  test("[img]地址[/img] 基础用法，地址作为单个文本子节点", () => {
    expect(parseUbb("[img]http://example.com/a.png[/img]")).toEqual([
      tag("img", [txt("http://example.com/a.png")]),
    ]);
  });

  test("[img=1] positionals[0]=1 表示默认不显示", () => {
    expect(parseUbb("[img=1]http://example.com/a.png[/img]")).toEqual([
      tagPos("img", ["1"], [txt("http://example.com/a.png")]),
    ]);
  });

  test("[img=0] positionals[0]=0 表示默认显示", () => {
    expect(parseUbb("[img=0]http://example.com/a.png[/img]")).toEqual([
      tagPos("img", ["0"], [txt("http://example.com/a.png")]),
    ]);
  });

  test("[img,title=标题] 仅命名参数 title，无位置参数", () => {
    expect(parseUbb("[img,title=标题]http://example.com/a.png[/img]")).toEqual([
      tagNamed("img", { title: "标题" }, [txt("http://example.com/a.png")]),
    ]);
  });

  test("[img=1,title=标题] positionals 与命名参数混合", () => {
    expect(parseUbb("[img=1,title=标题]http://example.com/a.png[/img]")).toEqual([
      tagBoth("img", ["1"], { title: "标题" }, [txt("http://example.com/a.png")]),
    ]);
  });

  test('[img=1,title="带空格的标题"] 引号被剥离', () => {
    expect(parseUbb('[img=1,title="带空格的标题"]http://example.com/a.png[/img]')).toEqual([
      tagBoth("img", ["1"], { title: "带空格的标题" }, [txt("http://example.com/a.png")]),
    ]);
  });

  test("[img][/img] 空内容", () => {
    expect(parseUbb("[img][/img]")).toEqual([tag("img", [])]);
  });

  test("[img][b]不递归[/b][/img] Text 模式，内部标签作为纯文本不解析", () => {
    expect(parseUbb("[img][b]不递归[/b][/img]")).toEqual([tag("img", [txt("[b]不递归[/b]")])]);
  });
});

describe("[audio] 和 [mp3] 标签（Text 模式）", () => {
  test("[audio]地址[/audio] 基础用法", () => {
    expect(parseUbb("[audio]http://example.com/a.mp3[/audio]")).toEqual([
      tag("audio", [txt("http://example.com/a.mp3")]),
    ]);
  });

  test("[mp3]地址[/mp3] 同一 handler 的另一标签名", () => {
    expect(parseUbb("[mp3]http://example.com/a.mp3[/mp3]")).toEqual([
      tag("mp3", [txt("http://example.com/a.mp3")]),
    ]);
  });

  test("[audio,title=曲名] 命名参数 title", () => {
    expect(parseUbb("[audio,title=测试曲名]http://example.com/a.mp3[/audio]")).toEqual([
      tagNamed("audio", { title: "测试曲名" }, [txt("http://example.com/a.mp3")]),
    ]);
  });

  test("[audio=1] handler 不使用位置参数，但解析层仍捕获", () => {
    expect(parseUbb("[audio=1]http://example.com/a.mp3[/audio]")).toEqual([
      tagPos("audio", ["1"], [txt("http://example.com/a.mp3")]),
    ]);
  });

  test("[audio][/audio] 空内容", () => {
    expect(parseUbb("[audio][/audio]")).toEqual([tag("audio", [])]);
  });

  test("[audio][b]不递归[/b][/audio] Text 模式，内部不解析", () => {
    expect(parseUbb("[audio][b]不递归[/b][/audio]")).toEqual([
      tag("audio", [txt("[b]不递归[/b]")]),
    ]);
  });
});

describe("[video] 标签（Text 模式）", () => {
  test("[video]地址[/video] 基础用法", () => {
    expect(parseUbb("[video]http://example.com/v.mp4[/video]")).toEqual([
      tag("video", [txt("http://example.com/v.mp4")]),
    ]);
  });

  test("[video=1] handler 不使用参数，解析层仍捕获 positionals[0]", () => {
    expect(parseUbb("[video=1]http://example.com/v.mp4[/video]")).toEqual([
      tagPos("video", ["1"], [txt("http://example.com/v.mp4")]),
    ]);
  });

  test("[video].m3u8 直播流地址", () => {
    expect(parseUbb("[video]http://example.com/live.m3u8[/video]")).toEqual([
      tag("video", [txt("http://example.com/live.m3u8")]),
    ]);
  });

  test("[video][/video] 空内容", () => {
    expect(parseUbb("[video][/video]")).toEqual([tag("video", [])]);
  });

  test("[video][b]不递归[/b][/video] Text 模式，内部不解析", () => {
    expect(parseUbb("[video][b]不递归[/b][/video]")).toEqual([
      tag("video", [txt("[b]不递归[/b]")]),
    ]);
  });
});

describe("[upload] 标签（Text 模式）", () => {
  test("[upload]地址[/upload] 不写参数也可解析", () => {
    expect(parseUbb("[upload]http://example.com/f.zip[/upload]")).toEqual([
      tag("upload", [txt("http://example.com/f.zip")]),
    ]);
  });

  test("[upload=jpg] positionals[0] 为图片扩展名", () => {
    expect(parseUbb("[upload=jpg]http://example.com/a.jpg[/upload]")).toEqual([
      tagPos("upload", ["jpg"], [txt("http://example.com/a.jpg")]),
    ]);
  });

  test("[upload=pdf] positionals[0] 为非图片扩展名", () => {
    expect(parseUbb("[upload=pdf]http://example.com/d.pdf[/upload]")).toEqual([
      tagPos("upload", ["pdf"], [txt("http://example.com/d.pdf")]),
    ]);
  });

  test("[upload][/upload] 空内容", () => {
    expect(parseUbb("[upload][/upload]")).toEqual([tag("upload", [])]);
  });

  test("[upload][b]不递归[/b][/upload] Text 模式，内部不解析", () => {
    expect(parseUbb("[upload][b]不递归[/b][/upload]")).toEqual([
      tag("upload", [txt("[b]不递归[/b]")]),
    ]);
  });
});

describe("[bili] 标签（Text 模式）", () => {
  test("[bili]BV号[/bili] 内容为 BV 号", () => {
    expect(parseUbb("[bili]BV1xx911y7xz[/bili]")).toEqual([tag("bili", [txt("BV1xx911y7xz")])]);
  });

  test("[bili]av号[/bili] 内容为纯数字 av 号", () => {
    expect(parseUbb("[bili]170001[/bili]")).toEqual([tag("bili", [txt("170001")])]);
  });

  test("[bili=2]BV号[/bili] positionals[0] 为分P数", () => {
    expect(parseUbb("[bili=2]BV1xx911y7xz[/bili]")).toEqual([
      tagPos("bili", ["2"], [txt("BV1xx911y7xz")]),
    ]);
  });

  test("[bili]B站URL[/bili] 内容为完整 URL", () => {
    expect(parseUbb("[bili]https://www.bilibili.com/video/BV1xx911y7xz[/bili]")).toEqual([
      tag("bili", [txt("https://www.bilibili.com/video/BV1xx911y7xz")]),
    ]);
  });

  test("[bili][/bili] 空内容", () => {
    expect(parseUbb("[bili][/bili]")).toEqual([tag("bili", [])]);
  });

  test("[bili][b]不递归[/b][/bili] Text 模式，内部不解析", () => {
    expect(parseUbb("[bili][b]不递归[/b][/bili]")).toEqual([tag("bili", [txt("[b]不递归[/b]")])]);
  });
});

describe("UrlTextHandler 文本处理器（非方括号标签）", () => {
  test("纯 https URL 文本保持为 text 节点，parseUbb 不识别为标签", () => {
    expect(parseUbb("https://cc98.org")).toEqual([txt("https://cc98.org")]);
  });

  test("裸域名文本（UrlTextHandler2）同样保持为 text 节点", () => {
    expect(parseUbb("cc98.org")).toEqual([txt("cc98.org")]);
  });
});
