/**
 * UBB 容错场景单元测试（TDD 红灯阶段）。
 *
 * 本文件只写测试。parseUbb 当前为占位实现（throw），测试全部失败属于预期。
 * 各场景对应的 Core.tsx（Forum/Ubb/Core.tsx）容错机制：
 *
 * 1. 未闭合标签：root.close() 触发 forceClose（Core.tsx:349-376）。未关闭标签的
 *    startTagString 降级为文本 segment，其子段递归 forceClose 并提升到父级作为兄弟。
 * 2. 孤立结束标签：tryHandleEndTag（Core.tsx:1153-1171）向上找不到同名开始标签时，
 *    把 [/x] 作为纯文字 segment 保留。
 * 3. 交叉嵌套：tryHandleEndTag 向上找到匹配开始标签后调用 close()，中间未关闭
 *    标签经 forceClose 降级；后续多余结束标签走孤立结束标签逻辑。
 * 4. 未知标签：buildSegmentsCore 无 handler 分支（Core.tsx:1235-1239），startTagString
 *    作为纯文字 segment 保留，后续结束标签因无对应开标签而再次转纯文字。
 * 5. Text 模式（code/md/noubb）：buildSegmentsCore 的 Text 分支（Core.tsx:1252-1272）
 *    用 content.indexOf(endTagString) 定位首个结束标签，中间内容作为单一文本 segment，
 *    不递归解析；找不到结束标签时 startTagString 降级为文本。
 * 6. 畸形输入：tagMatchRegExp 找不到配对 ] 时（Core.tsx:1189-1212），剩余整段作为
 *    文本 segment；属性解析见 UbbTagData.parse（Core.tsx:520-692）。
 * 7. 空输入/纯文本：无标签匹配，整段作为文本（Core.tsx:1203-1212）。
 *
 * 关于相邻文本节点：Core.tsx 把不同时机收集的文本作为独立 UbbTextSegment，渲染时
 * 也分别输出，不合并。本测试依此保持独立文本节点（与 parse-structure.test.ts 中
 * “上文[line]下文”三分段的行为一致）。
 */
import { describe, expect, test } from "vite-plus/test";
import { parseUbb } from "../src/index.ts";
import { txt, tag, tagPos } from "./helpers.ts";

describe("未闭合标签（forceClose 降级为文本）", () => {
  test("[b] 未闭合：startTagString 降级，子内容提升为兄弟文本", () => {
    // [b] 从未 close。root.close() 时 forceClose(b, root)：
    //   b 未关闭 → root 得到文本 "[b]"（b.startTagString）；
    //   b 的子段 "没有闭合" 递归 forceClose → 提升为 root 子文本。
    expect(parseUbb("[b]没有闭合")).toEqual([txt("[b]"), txt("没有闭合")]);
  });

  test("[code] Text 模式未闭合：startTagString 降级，后续内容作普通文本", () => {
    // Text 分支 indexOf 找不到 [/code]，仅把 "[code]" 降级为文本；
    // 循环继续，"incomplete" 在下一轮作为 remainContent 收集为文本。
    expect(parseUbb("[code]incomplete")).toEqual([txt("[code]"), txt("incomplete")]);
  });
});

describe("孤立结束标签（tryHandleEndTag 转纯文字）", () => {
  test("[/b] 无匹配开始标签，作为纯文字保留", () => {
    // "孤立" 先作为文本；[/b] 走 tryHandleEndTag，root 无 tagData，向上无匹配，
    // 故 "[/b]" 转纯文字。
    expect(parseUbb("孤立[/b]")).toEqual([txt("孤立"), txt("[/b]")]);
  });
});

describe("交叉嵌套", () => {
  test("[b][i]Text[/b][/i] 的 Core.tsx 行为", () => {
    // 逐步追踪 buildSegmentsCore + tryHandleEndTag + forceClose：
    //   1. [b]  → 开 b 栈，parent = b
    //   2. [i]  → 开 i 栈（b 的子段），parent = i
    //   3. Text → i 的文本子段
    //   4. [/b] → tryHandleEndTag("b", i)：从 i 向上找到 b，调用 b.close()，
    //             返回 root。b.close() 对子段 i 执行 forceClose(i, b)：
    //               i 未关闭 → b 得到文本 "[i]"（i.startTagString）；
    //               i 的子段 "Text" 递归 forceClose → 提升为 b 的子文本。
    //             故 b 的子段 = [文本"[i]", 文本"Text"]。
    //   5. [/i] → tryHandleEndTag("i", root)：root.tagData 为空，无匹配，
    //             "[/i]" 走孤立结束标签逻辑转纯文字。
    expect(parseUbb("[b][i]Text[/b][/i]")).toEqual([
      tag("b", [txt("[i]"), txt("Text")]),
      txt("[/i]"),
    ]);
  });
});

describe("未知标签（无 handler，startTagString 转纯文字）", () => {
  test("[foo] 未知：开闭标签与中间内容均保留为文本，不吞用户内容", () => {
    // [foo] 无 handler → "[foo]" 转文本；"内容" 作普通文本；
    // [/foo] 无匹配开标签 → "[/foo]" 转文本。
    expect(parseUbb("[foo]内容[/foo]")).toEqual([txt("[foo]"), txt("内容"), txt("[/foo]")]);
  });

  test("[ghost] 未知：同上", () => {
    expect(parseUbb("[ghost]World[/ghost]")).toEqual([
      txt("[ghost]"),
      txt("World"),
      txt("[/ghost]"),
    ]);
  });
});

describe("Text 模式标签内部内容（indexOf 取首个结束标签，不递归）", () => {
  test("[code] 内部 [b] 不被解析，保持原文", () => {
    expect(parseUbb("[code]var x = [b]test[/b];[/code]")).toEqual([
      tag("code", [txt("var x = [b]test[/b];")]),
    ]);
  });

  test("[noubb] 嵌套：indexOf 取首个 [/noubb]，内层 [noubb]Test 作原文", () => {
    // Core.tsx Text 分支用 content.indexOf(endTagString) 定位首个结束标签，
    // 不会智能匹配嵌套层次。故外层 [noubb] 的内容是 "[noubb]Test"（首个
    // [/noubb] 之前的全部字面量），第二个 [/noubb] 成为孤立结束标签转纯文字。
    // 任务简述里“内容是 [noubb]Test[/noubb]”与 Core.tsx 实际行为不符，
    // 此处以 Core.tsx 为准。
    expect(parseUbb("[noubb][noubb]Test[/noubb][/noubb]")).toEqual([
      tag("noubb", [txt("[noubb]Test")]),
      txt("[/noubb]"),
    ]);
  });

  test("[noubb]Test[/noubb][/noubb]：首个 [/noubb] 关闭，第二个孤立转文本", () => {
    expect(parseUbb("[noubb]Test[/noubb][/noubb]")).toEqual([
      tag("noubb", [txt("Test")]),
      txt("[/noubb]"),
    ]);
  });
});

describe("畸形输入", () => {
  test("缺少右括号 ]：整段回落为文本", () => {
    // tagMatchRegExp 找不到配对 ]，"[b text" 不构成标签，
    // 整段 "This is [b text" 作为单个文本 segment。
    expect(parseUbb("This is [b text")).toEqual([txt("This is [b text")]);
  });

  test("[color=] 空属性值：识别为 color 标签，positionals 含空字符串", () => {
    // UbbTagData.parse：首个 token 以 [=,] 为分隔符（lastTokenType 初始为
    // ItemSeperator，matchExp = /[=,]/i），故 "color=" 切出 name="color"，
    // 等号后无值 → mainValue 为空。新解析器将其映射为 positionals=[""]。
    expect(parseUbb("[color=]Text[/color]")).toEqual([tagPos("color", [""], [txt("Text")])]);
  });
});

describe("空输入和纯文本", () => {
  test("空字符串返回空数组", () => {
    expect(parseUbb("")).toEqual([]);
  });

  test("纯文本返回单个文本节点", () => {
    expect(parseUbb("hello")).toEqual([txt("hello")]);
  });

  test("纯空白字符作为文本节点", () => {
    expect(parseUbb("  ")).toEqual([txt("  ")]);
  });
});
