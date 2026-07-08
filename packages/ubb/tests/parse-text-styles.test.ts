/**
 * 调研摘要（来源：Forum/Ubb/ 下各 handler + Core.tsx）
 *
 * 文字样式类（均 extends RecursiveTagHandler，tagMode=Recursive，内部递归解析子标签）：
 * - [b]：BTagHandler，无参数，attrs={named:{}}，加粗。
 * - [i]：ITagHandler，无参数，斜体。
 * - [u]：UTagHandler，无参数，下划线。
 * - [del]：DelTagHandler，无参数，删除线。
 * - [english]：EnglishTagHandler，无参数，英文字体（Arial）。
 * - [left]/[center]/[right]：Left/Center/RightTagHandler，无参数，对应 text-align。
 *
 * 带位置参数类（tagMode=Recursive，positionals[0] 携带样式值）：
 *   注：老代码用 tagData.value('标签名') 读命名参数（如 value('size')），
 *   新 AST 模型映射到 positionals[0]，named 恒为 {}——与 [topic]/[board] 等站点
 *   链接标签一致（见 parse-site-semantics.test.ts）。
 * - [size=数字]：SizeTagHandler，positionals[0]=字号（如 "5"），handler 内 parseInt。
 * - [color=颜色名或#hex]：ColorTagHandler，positionals[0]=颜色值（如 "red"、"#ff0000"）。
 * - [font=字体名]：FontTagHandler，positionals[0]=字体名（如 "宋体"）。
 * - [align=left/right/center]：AlignTagHandler，positionals[0]=对齐方式。
 * - [cursor=类型]：CursorTagHandler，positionals[0]=光标类型（如 "pointer"）。
 *
 * 表情类（正则标签名，Empty 模式）：
 * - [em\d{2}]：EmTagHandler，正则 /^em\d{2}$/i，getTagMode 覆盖为 Empty。
 *   children 恒为 []；ID 范围 0-91（范围校验在渲染层，解析层照建标签不拦截）。
 *   Empty 语义：标签后内容视为同级兄弟；若紧跟同名结束标签则忽略
 *   （即 [em01][/em01] 等价于 [em01]）。
 *
 * 通用约束：tag 名一律小写（大写标签名归一化）；Empty 标签 children 恒为 []。
 */
import { describe, expect, test } from "vite-plus/test";
import { parseUbb } from "../src/index.ts";
import { txt, tag, tagPos } from "./helpers.ts";

describe("[b] 标签", () => {
  test("[b]text[/b] 基础用法", () => {
    expect(parseUbb("[b]粗体[/b]")).toEqual([tag("b", [txt("粗体")])]);
  });

  test("[b][/b] 空内容 children 为空数组", () => {
    expect(parseUbb("[b][/b]")).toEqual([tag("b", [])]);
  });

  test("[b][i]嵌套[/i][/b] 嵌套递归", () => {
    expect(parseUbb("[b][i]嵌套[/i][/b]")).toEqual([tag("b", [tag("i", [txt("嵌套")])])]);
  });

  test("[B]大写标签名归一化为小写", () => {
    expect(parseUbb("[B]粗体[/B]")).toEqual([tag("b", [txt("粗体")])]);
  });

  test("[b]a[/b]b 标签与文本互为兄弟节点", () => {
    expect(parseUbb("[b]a[/b]b")).toEqual([tag("b", [txt("a")]), txt("b")]);
  });
});

describe("[i] 标签", () => {
  test("[i]text[/i] 基础用法", () => {
    expect(parseUbb("[i]斜体[/i]")).toEqual([tag("i", [txt("斜体")])]);
  });

  test("[i][/i] 空内容", () => {
    expect(parseUbb("[i][/i]")).toEqual([tag("i", [])]);
  });

  test("[i][b]嵌套[/b][/i] 嵌套递归", () => {
    expect(parseUbb("[i][b]嵌套[/b][/i]")).toEqual([tag("i", [tag("b", [txt("嵌套")])])]);
  });
});

describe("[u] 标签", () => {
  test("[u]text[/u] 基础用法", () => {
    expect(parseUbb("[u]下划线[/u]")).toEqual([tag("u", [txt("下划线")])]);
  });

  test("[u][/u] 空内容", () => {
    expect(parseUbb("[u][/u]")).toEqual([tag("u", [])]);
  });

  test("[u][b]嵌套[/b][/u] 嵌套递归", () => {
    expect(parseUbb("[u][b]嵌套[/b][/u]")).toEqual([tag("u", [tag("b", [txt("嵌套")])])]);
  });
});

describe("[del] 标签", () => {
  test("[del]text[/del] 基础用法", () => {
    expect(parseUbb("[del]删除线[/del]")).toEqual([tag("del", [txt("删除线")])]);
  });

  test("[del][/del] 空内容", () => {
    expect(parseUbb("[del][/del]")).toEqual([tag("del", [])]);
  });

  test("[del][b]嵌套[/b][/del] 嵌套递归", () => {
    expect(parseUbb("[del][b]嵌套[/b][/del]")).toEqual([tag("del", [tag("b", [txt("嵌套")])])]);
  });
});

describe("[english] 标签", () => {
  test("[english]text[/english] 基础用法", () => {
    expect(parseUbb("[english]English Text[/english]")).toEqual([
      tag("english", [txt("English Text")]),
    ]);
  });

  test("[english][/english] 空内容", () => {
    expect(parseUbb("[english][/english]")).toEqual([tag("english", [])]);
  });

  test("[english][b]嵌套[/b][/english] 嵌套递归", () => {
    expect(parseUbb("[english][b]嵌套[/b][/english]")).toEqual([
      tag("english", [tag("b", [txt("嵌套")])]),
    ]);
  });
});

describe("[size] 标签", () => {
  test("[size=5] 解析 positionals，named 恒为 {}", () => {
    expect(parseUbb("[size=5]大字[/size]")).toEqual([tagPos("size", ["5"], [txt("大字")])]);
  });

  test("[size=5][/size] 空内容", () => {
    expect(parseUbb("[size=5][/size]")).toEqual([tagPos("size", ["5"])]);
  });

  test("[size=5][b]嵌套[/b][/size] 嵌套递归", () => {
    expect(parseUbb("[size=5][b]嵌套[/b][/size]")).toEqual([
      tagPos("size", ["5"], [tag("b", [txt("嵌套")])]),
    ]);
  });

  test("[SIZE=5] 大写标签名归一化，positionals 保留原样", () => {
    expect(parseUbb("[SIZE=5]大字[/SIZE]")).toEqual([tagPos("size", ["5"], [txt("大字")])]);
  });
});

describe("[color] 标签", () => {
  test("[color=red] 颜色名作为 positionals[0]", () => {
    expect(parseUbb("[color=red]红字[/color]")).toEqual([tagPos("color", ["red"], [txt("红字")])]);
  });

  test("[color=#ff0000] 十六进制色值作为 positionals[0]", () => {
    expect(parseUbb("[color=#ff0000]红字[/color]")).toEqual([
      tagPos("color", ["#ff0000"], [txt("红字")]),
    ]);
  });

  test("[color=red][/color] 空内容", () => {
    expect(parseUbb("[color=red][/color]")).toEqual([tagPos("color", ["red"])]);
  });

  test("[color=blue][b]嵌套[/b][/color] 嵌套递归", () => {
    expect(parseUbb("[color=blue][b]嵌套[/b][/color]")).toEqual([
      tagPos("color", ["blue"], [tag("b", [txt("嵌套")])]),
    ]);
  });
});

describe("[font] 标签", () => {
  test("[font=宋体] 中文字体名作为 positionals[0]", () => {
    expect(parseUbb("[font=宋体]正文[/font]")).toEqual([tagPos("font", ["宋体"], [txt("正文")])]);
  });

  test("[font=宋体][/font] 空内容", () => {
    expect(parseUbb("[font=宋体][/font]")).toEqual([tagPos("font", ["宋体"])]);
  });

  test("[font=Arial][b]嵌套[/b][/font] 嵌套递归", () => {
    expect(parseUbb("[font=Arial][b]嵌套[/b][/font]")).toEqual([
      tagPos("font", ["Arial"], [tag("b", [txt("嵌套")])]),
    ]);
  });

  test("[FONT=宋体] 大写标签名归一化", () => {
    expect(parseUbb("[FONT=宋体]正文[/FONT]")).toEqual([tagPos("font", ["宋体"], [txt("正文")])]);
  });
});

describe("[align] 标签", () => {
  test("[align=center] center 作为 positionals[0]", () => {
    expect(parseUbb("[align=center]居中[/align]")).toEqual([
      tagPos("align", ["center"], [txt("居中")]),
    ]);
  });

  test("[align=left] 和 [align=right] 解析对应 positionals[0]", () => {
    expect(parseUbb("[align=left]左[/align]")).toEqual([tagPos("align", ["left"], [txt("左")])]);
    expect(parseUbb("[align=right]右[/align]")).toEqual([tagPos("align", ["right"], [txt("右")])]);
  });

  test("[align=center][/align] 空内容", () => {
    expect(parseUbb("[align=center][/align]")).toEqual([tagPos("align", ["center"])]);
  });

  test("[align=center][b]嵌套[/b][/align] 嵌套递归", () => {
    expect(parseUbb("[align=center][b]嵌套[/b][/align]")).toEqual([
      tagPos("align", ["center"], [tag("b", [txt("嵌套")])]),
    ]);
  });
});

describe("[left] 标签", () => {
  test("[left]text[/left] 基础用法，无参数", () => {
    expect(parseUbb("[left]左对齐[/left]")).toEqual([tag("left", [txt("左对齐")])]);
  });

  test("[left][/left] 空内容", () => {
    expect(parseUbb("[left][/left]")).toEqual([tag("left", [])]);
  });

  test("[left][b]嵌套[/b][/left] 嵌套递归", () => {
    expect(parseUbb("[left][b]嵌套[/b][/left]")).toEqual([tag("left", [tag("b", [txt("嵌套")])])]);
  });
});

describe("[center] 标签", () => {
  test("[center]text[/center] 基础用法，无参数", () => {
    expect(parseUbb("[center]居中[/center]")).toEqual([tag("center", [txt("居中")])]);
  });

  test("[center][/center] 空内容", () => {
    expect(parseUbb("[center][/center]")).toEqual([tag("center", [])]);
  });

  test("[center][b]嵌套[/b][/center] 嵌套递归", () => {
    expect(parseUbb("[center][b]嵌套[/b][/center]")).toEqual([
      tag("center", [tag("b", [txt("嵌套")])]),
    ]);
  });
});

describe("[right] 标签", () => {
  test("[right]text[/right] 基础用法，无参数", () => {
    expect(parseUbb("[right]右对齐[/right]")).toEqual([tag("right", [txt("右对齐")])]);
  });

  test("[right][/right] 空内容", () => {
    expect(parseUbb("[right][/right]")).toEqual([tag("right", [])]);
  });

  test("[right][b]嵌套[/b][/right] 嵌套递归", () => {
    expect(parseUbb("[right][b]嵌套[/b][/right]")).toEqual([
      tag("right", [tag("b", [txt("嵌套")])]),
    ]);
  });
});

describe("[cursor] 标签", () => {
  test("[cursor=pointer] 解析 positionals[0]", () => {
    expect(parseUbb("[cursor=pointer]悬停[/cursor]")).toEqual([
      tagPos("cursor", ["pointer"], [txt("悬停")]),
    ]);
  });

  test("[cursor=pointer][/cursor] 空内容", () => {
    expect(parseUbb("[cursor=pointer][/cursor]")).toEqual([tagPos("cursor", ["pointer"])]);
  });

  test("[cursor=help][b]嵌套[/b][/cursor] 嵌套递归", () => {
    expect(parseUbb("[cursor=help][b]嵌套[/b][/cursor]")).toEqual([
      tagPos("cursor", ["help"], [tag("b", [txt("嵌套")])]),
    ]);
  });

  test("[cursor=anything] 任意值原样保留到 positionals[0]", () => {
    expect(parseUbb("[cursor=custom-val]x[/cursor]")).toEqual([
      tagPos("cursor", ["custom-val"], [txt("x")]),
    ]);
  });
});

describe("[em\\d{2}] 表情标签（Empty）", () => {
  test("[em01] 自闭合，children 恒为 []，无 positionals", () => {
    expect(parseUbb("[em01]")).toEqual([tag("em01")]);
  });

  test("[em01][/em01] 显式配对，结束标签被忽略，children 仍为空", () => {
    expect(parseUbb("[em01][/em01]")).toEqual([tag("em01")]);
  });

  test("[em01][em02] 连续表情互不为父子", () => {
    expect(parseUbb("[em01][em02]")).toEqual([tag("em01"), tag("em02")]);
  });

  test("a[em01]b 文本中嵌入，前后文本为兄弟节点", () => {
    expect(parseUbb("a[em01]b")).toEqual([txt("a"), tag("em01"), txt("b")]);
  });

  test("[EM01] 大写归一化为小写", () => {
    expect(parseUbb("[EM01]")).toEqual([tag("em01")]);
  });

  test("[em00] 与 [em91] ID 边界（解析层不拦截范围）", () => {
    expect(parseUbb("[em00]")).toEqual([tag("em00")]);
    expect(parseUbb("[em91]")).toEqual([tag("em91")]);
  });
});
