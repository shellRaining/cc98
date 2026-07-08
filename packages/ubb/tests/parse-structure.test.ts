/**
 * 调研摘要（来源：Forum/Ubb/ 下各 handler + Core.tsx）
 *
 * contextFree（Text 模式，内部不递归解析，内容作为单一文本节点）：
 * - [code]：CodeTagHandler extends TextTagHandler，tagMode=Text。
 *   handler 只关心纯文字（按行渲染 <li>），不递归子标签。
 * - [md]：MdTagHandler extends TextTagHandler，tagMode=Text。
 *   内容整段交给 remark 渲染 Markdown，UBB 方括号保持原文。
 * - [noubb]：NoUbbTagHandler extends TextTagHandler，tagMode=Text。
 *   内容原样输出（<code> 或 <span>），不解析任何 UBB。
 *   上述三者，Core 的 Text 分支用 indexOf 找结束标签 [/${tagName}]，把中间内容
 *   拼成单个 UbbTextSegment，所以 AST 里 children 恒为单文本节点（含换行、等号、
 *   方括号等一律保留原字面量）。
 *
 * 表格类（均 extends RecursiveTagHandler，tagMode=Recursive，递归建树）：
 * - [table]：TableTagHandler，无参数，渲染 <table>。
 * - [tr]：TrTagHandler，无参数，渲染 <tr>。
 * - [td]：TdTagHandler，至多 2 个位置参数 value(0)=rowspan, value(1)=colspan。
 *   第一个位置参数映射到 positionals[0]（如 [td=2]）；content 为单元格内容。
 *   双参数 [td=2,3] 场景待补充（见 review 结论）。
 * - [th]：ThTagHandler，参数语义与 td 完全一致（rowspan, colspan），渲染 <th>。
 *
 * 引用类（extends RecursiveTagHandler，tagMode=Recursive）：
 * - [quote] / [quotex]：QuoteTagHandler.supportedTagNames 同时支持两个标签名。
 *   老代码的"嵌套抹平"（flatQuote）在 exec 渲染层完成，parseUbb 只负责建树，
 *   所以 [quote][quote]x[/quote][/quote] 照常递归嵌套。
 *   [quote=来源] 的来源信息落到 positionals[0]（引用来源）。
 *
 * 分割线（Empty 模式，自闭合，children 恒为 []）：
 * - [line]：LineTagHandler extends RecursiveTagHandler，但重写 getTagMode 返回 Empty。
 *   渲染 <hr>，无内容、无参数。
 *
 * 通用约束：tag 名一律小写；Text 标签 children 恒为单文本节点；Empty 标签 children 恒为 []。
 */
import { describe, expect, test } from "vite-plus/test";
import { parseUbb } from "../src/index.ts";
import { txt, tag, tagPos } from "./helpers.ts";

describe("[code] 标签（Text 模式，内部不递归）", () => {
  test("纯代码内容作为单一文本节点", () => {
    expect(parseUbb("[code]console.log(1)[/code]")).toEqual([tag("code", [txt("console.log(1)")])]);
  });

  test("内部 UBB 标签不被解析，保留为原始文本", () => {
    expect(parseUbb("[code][b]不递归[/b][/code]")).toEqual([tag("code", [txt("[b]不递归[/b]")])]);
  });

  test("多行内容保留换行，拼接成单一文本节点", () => {
    expect(parseUbb("[code]line1\nline2[/code]")).toEqual([tag("code", [txt("line1\nline2")])]);
  });

  test("多个内部 UBB 标签均保留为字面量", () => {
    expect(parseUbb("[code][b]粗[/b][i]斜[/i][/code]")).toEqual([
      tag("code", [txt("[b]粗[/b][i]斜[/i]")]),
    ]);
  });
});

describe("[md] 标签（Text 模式，内部不递归）", () => {
  test("Markdown 内容作为纯文本", () => {
    expect(parseUbb("[md]**粗体**[/md]")).toEqual([tag("md", [txt("**粗体**")])]);
  });

  test("内部 UBB 标签不被解析", () => {
    expect(parseUbb("[md][b]不递归[/b][/md]")).toEqual([tag("md", [txt("[b]不递归[/b]")])]);
  });
});

describe("[noubb] 标签（Text 模式，内部不递归）", () => {
  test("内部 UBB 标签保持原文", () => {
    expect(parseUbb("[noubb][b]原始[/b][/noubb]")).toEqual([tag("noubb", [txt("[b]原始[/b]")])]);
  });

  test("含等号的标签写法不被误解析为属性", () => {
    expect(parseUbb("[noubb][url=http://x.com]链接[/url][/noubb]")).toEqual([
      tag("noubb", [txt("[url=http://x.com]链接[/url]")]),
    ]);
  });
});

describe("[table]/[tr]/[td]/[th] 表格嵌套结构（Recursive）", () => {
  test("单行两列：table>tr>td 完整嵌套", () => {
    expect(parseUbb("[table][tr][td]A[/td][td]B[/td][/tr][/table]")).toEqual([
      tag("table", [tag("tr", [tag("td", [txt("A")]), tag("td", [txt("B")])])]),
    ]);
  });

  test("th 表头与 td 同为 tr 子节点", () => {
    expect(parseUbb("[table][tr][th]姓名[/th][th]分数[/th][/tr][/table]")).toEqual([
      tag("table", [tag("tr", [tag("th", [txt("姓名")]), tag("th", [txt("分数")])])]),
    ]);
  });

  test("多行表格：多个 tr 互为兄弟节点", () => {
    expect(parseUbb("[table][tr][td]1[/td][/tr][tr][td]2[/td][/tr][/table]")).toEqual([
      tag("table", [tag("tr", [tag("td", [txt("1")])]), tag("tr", [tag("td", [txt("2")])])]),
    ]);
  });

  test("td 单元格内部文本递归建树", () => {
    expect(parseUbb("[td]单元格内容[/td]")).toEqual([tag("td", [txt("单元格内容")])]);
  });
});

describe("[quote] 和 [quotex] 标签（Recursive）", () => {
  test("基础引用，内容为子文本", () => {
    expect(parseUbb("[quote]引用内容[/quote]")).toEqual([tag("quote", [txt("引用内容")])]);
  });

  test("嵌套引用照常建树，抹平是渲染层的事", () => {
    expect(parseUbb("[quote][quote]内层[/quote]外层文本[/quote]")).toEqual([
      tag("quote", [tag("quote", [txt("内层")]), txt("外层文本")]),
    ]);
  });

  test("[quote=来源] positionals[0] 携带引用来源", () => {
    expect(parseUbb("[quote=大牛]他说的话[/quote]")).toEqual([
      tagPos("quote", ["大牛"], [txt("他说的话")]),
    ]);
  });

  test("[quotex] 变体同样递归建树", () => {
    expect(parseUbb("[quotex]引用内容[/quotex]")).toEqual([tag("quotex", [txt("引用内容")])]);
  });
});

describe("[line] 标签（Empty，自闭合）", () => {
  test("[line] 自闭合，children 为空", () => {
    expect(parseUbb("[line]")).toEqual([tag("line")]);
  });

  test("文本中嵌入 [line]，前后文本为兄弟节点", () => {
    expect(parseUbb("上文[line]下文")).toEqual([txt("上文"), tag("line"), txt("下文")]);
  });
});
