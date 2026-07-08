/**
 * 调研摘要（来源：Forum/Ubb/ 下各 handler + Core.tsx）
 *
 * 站内链接类：
 * - [user=用户名]：UserTagHandler，extends TextTagHandler，tagMode=Recursive（基类默认未覆盖）。
 *   handler 实际用 inner content 作显示名，但 [user=xxx] 形式 positionals[0] 携带用户名。
 * - [topic=帖子ID]：TopicTagHandler，extends RecursiveTagHandler，tagMode=Recursive。
 *   1 个参数=topicID；2 个参数(legacy 废弃)=boardID,topicID。positionals[0] 取第一个参数。
 * - [board=板块ID]：BoardTagHandler，extends RecursiveTagHandler，tagMode=Recursive。
 *   positionals[0]=板块ID，children=板块名。
 * - [pm=用户名]：PmTagHandler，extends RecursiveTagHandler，tagMode=Recursive。
 *   positionals[0]=私信目标用户名。
 *
 * 权限/可见性类（均继承 MessageBarTagHandlerBase，tagMode=Empty，children 恒为 []）：
 * - [needreply]：无参数或 [needreply=0]，positionals[0]=消息索引，共 1 种消息。
 * - [posteronly]：无参数或 [posteronly=0..3]，positionals[0]=消息索引，共 4 种消息。
 * - [allowviewer]：无参数或 [allowviewer=0..2]，positionals[0]=消息索引(数字 parseInt)，共 3 种消息。
 *   注：任务描述称"用户名列表"，但 handler 实际 parseInt(positionals[0]) 当消息索引，本测试按代码行为。
 *
 * 数学类：
 * - [math] / [m]：MathTagHandler，extends TextTagHandler。老代码 getTagMode 未覆盖(=Recursive)，
 *   但本组按任务指示断言 Text 模式（内部不递归），实现需将 math/m 纳入 contextFreeTags 或等效机制。
 *   m=行内模式，math=块级模式。
 * - MathTextHandler：UbbTextHandler，正则 /(\$\$(.+)\$\$|\$(.+)\$)/i。
 *   属文本处理器，不在 parseUbb 方括号解析范围，$...$ 保持纯文本节点。
 *
 * 正则标签名（均 tagMode=Empty，children 恒为 []，无参数时 attrs={named:{}}）：
 * - [ac\d{2}] 或 [ac\d{4}]：正则 /^ac(\d{2}|\d{4})$/i。
 *   ID 范围：1-54、1001-1040、2001-2055（范围校验在渲染层，解析层照建标签不拦截）。
 * - [ms\d{2}]：正则 /^ms\d{2}$/i。ID 范围：1-54。
 * - [[acf]:\d{3}]：正则 /^([acf]):(\d{3})$/i（麻将表情，tag 名含冒号）。
 *   a=动物(1-16)，c=卡通(特定值)，f=人脸(1-208)。
 * - [CC98\d{2}]：正则 /^CC98\d{2}$/i。ID 范围：1-37。解析层 normalize 为小写 cc98nn。
 * - [tb\d{2}]：正则 /^tb\d{2}$/i。ID 范围：1-33。
 *
 * 通用约束：tag 名一律小写；Empty 标签 children 恒为 []。
 */
import { describe, expect, test } from "vite-plus/test";
import { parseUbb } from "../src/index.ts";
import { txt, tag, tagPos } from "./helpers.ts";

describe("[user] 标签", () => {
  test("[user=用户名] 解析 positionals[0]，无内容时 children 为空", () => {
    expect(parseUbb("[user=张三]")).toEqual([tagPos("user", ["张三"])]);
  });

  test("[user]用户名[/user] 内容形式，用户名作为子文本", () => {
    expect(parseUbb("[user]张三[/user]")).toEqual([tag("user", [txt("张三")])]);
  });

  test("中文与数字混合用户名", () => {
    expect(parseUbb("[user=测试用户123]")).toEqual([tagPos("user", ["测试用户123"])]);
  });
});

describe("[topic] 标签", () => {
  test("[topic=ID] 位置参数形式", () => {
    expect(parseUbb("[topic=123]")).toEqual([tagPos("topic", ["123"])]);
  });

  test("[topic=ID]标题[/topic] 带链接文字", () => {
    expect(parseUbb("[topic=123]帖子标题[/topic]")).toEqual([
      tagPos("topic", ["123"], [txt("帖子标题")]),
    ]);
  });

  test("大数字 topic ID", () => {
    expect(parseUbb("[topic=99999]大数字[/topic]")).toEqual([
      tagPos("topic", ["99999"], [txt("大数字")]),
    ]);
  });
});

describe("[board] 标签", () => {
  test("[board=ID] 位置参数形式", () => {
    expect(parseUbb("[board=456]")).toEqual([tagPos("board", ["456"])]);
  });

  test("[board=ID]板块名[/board] 带板块名称", () => {
    expect(parseUbb("[board=456]板块名称[/board]")).toEqual([
      tagPos("board", ["456"], [txt("板块名称")]),
    ]);
  });
});

describe("[pm] 标签", () => {
  test("[pm=用户名] 位置参数形式", () => {
    expect(parseUbb("[pm=李四]")).toEqual([tagPos("pm", ["李四"])]);
  });

  test("[pm=用户名]私信内容[/pm] 带内容", () => {
    expect(parseUbb("[pm=李四]私信内容[/pm]")).toEqual([tagPos("pm", ["李四"], [txt("私信内容")])]);
  });
});

describe("[needreply] 标签（Empty）", () => {
  test("[needreply] 无参数，attrs 为 {positionals:[], named:{}}", () => {
    expect(parseUbb("[needreply]")).toEqual([tag("needreply")]);
  });

  test("[needreply=0] positionals[0] 为消息索引", () => {
    expect(parseUbb("[needreply=0]")).toEqual([tagPos("needreply", ["0"])]);
  });
});

describe("[posteronly] 标签（Empty）", () => {
  test("[posteronly] 无参数，attrs 为 {positionals:[], named:{}}", () => {
    expect(parseUbb("[posteronly]")).toEqual([tag("posteronly")]);
  });

  test("[posteronly=1] positionals[0] 为消息索引", () => {
    expect(parseUbb("[posteronly=1]")).toEqual([tagPos("posteronly", ["1"])]);
  });
});

describe("[allowviewer] 标签（Empty）", () => {
  test("[allowviewer] 无参数，attrs 为 {positionals:[], named:{}}", () => {
    expect(parseUbb("[allowviewer]")).toEqual([tag("allowviewer")]);
  });

  test("[allowviewer=2] positionals[0] 为消息索引（数字）", () => {
    expect(parseUbb("[allowviewer=2]")).toEqual([tagPos("allowviewer", ["2"])]);
  });
});

describe("[math] 和 [m] 标签（Text 模式，内部不递归）", () => {
  test("[math] 块级公式，内部内容作为纯文本", () => {
    expect(parseUbb("[math]E=mc^2[/math]")).toEqual([tag("math", [txt("E=mc^2")])]);
  });

  test("[m] 行内公式", () => {
    expect(parseUbb("[m]x^2[/m]")).toEqual([tag("m", [txt("x^2")])]);
  });

  test("[math] 内部 UBB 标签不被解析为子标签", () => {
    expect(parseUbb("[math][b]不递归[/b][/math]")).toEqual([tag("math", [txt("[b]不递归[/b]")])]);
  });

  test("[math] 内部含等号不被误解析为属性", () => {
    expect(parseUbb("[math]a=b+c[/math]")).toEqual([tag("math", [txt("a=b+c")])]);
  });
});

describe("MathTextHandler 行内公式（$...$）", () => {
  test("$...$ 不属于方括号语法，parseUbb 保持纯文本", () => {
    expect(parseUbb("$x^2$")).toEqual([txt("$x^2$")]);
  });

  test("$$...$$ 块级公式同样保持纯文本", () => {
    expect(parseUbb("$$\\int_0^1 x dx$$")).toEqual([txt("$$\\int_0^1 x dx$$")]);
  });
});

describe("[acNN] 表情标签（Empty）", () => {
  test("[ac01] 自闭合，children 为空，无位置参数", () => {
    expect(parseUbb("[ac01]")).toEqual([tag("ac01")]);
  });

  test("[ac54] 2 位 ID 上界", () => {
    expect(parseUbb("[ac54]")).toEqual([tag("ac54")]);
  });

  test("[ac1001] 4 位 ID 第一组", () => {
    expect(parseUbb("[ac1001]")).toEqual([tag("ac1001")]);
  });

  test("[ac2001] 4 位 ID 第二组", () => {
    expect(parseUbb("[ac2001]")).toEqual([tag("ac2001")]);
  });

  test("hello[ac01]world 文本中嵌入，前后文本为兄弟节点", () => {
    expect(parseUbb("hello[ac01]world")).toEqual([txt("hello"), tag("ac01"), txt("world")]);
  });

  test("[ac01][/ac01] 显式配对，children 仍为空", () => {
    expect(parseUbb("[ac01][/ac01]")).toEqual([tag("ac01")]);
  });

  test("[ac01][ac02] 连续表情互不为父子", () => {
    expect(parseUbb("[ac01][ac02]")).toEqual([tag("ac01"), tag("ac02")]);
  });
});

describe("[msNN] 表情标签（Empty）", () => {
  test("[ms01] 自闭合", () => {
    expect(parseUbb("[ms01]")).toEqual([tag("ms01")]);
  });

  test("[ms54] ID 上界", () => {
    expect(parseUbb("[ms54]")).toEqual([tag("ms54")]);
  });
});

describe("麻将表情 [a/c/f:NNN]（Empty）", () => {
  test("[a:001] 动物类，tag 名含冒号", () => {
    expect(parseUbb("[a:001]")).toEqual([tag("a:001")]);
  });

  test("[c:003] 卡通类", () => {
    expect(parseUbb("[c:003]")).toEqual([tag("c:003")]);
  });

  test("[f:208] 人脸类 ID 上界", () => {
    expect(parseUbb("[f:208]")).toEqual([tag("f:208")]);
  });

  test("[A:001] 大写归一化为小写", () => {
    expect(parseUbb("[A:001]")).toEqual([tag("a:001")]);
  });
});

describe("[cc98NN] 标签（Empty）", () => {
  test("[cc9801] 自闭合", () => {
    expect(parseUbb("[cc9801]")).toEqual([tag("cc9801")]);
  });

  test("[cc9837] ID 上界", () => {
    expect(parseUbb("[cc9837]")).toEqual([tag("cc9837")]);
  });

  test("[CC9801] 大写归一化为小写", () => {
    expect(parseUbb("[CC9801]")).toEqual([tag("cc9801")]);
  });
});

describe("[tbNN] 标签（Empty）", () => {
  test("[tb01] 自闭合", () => {
    expect(parseUbb("[tb01]")).toEqual([tag("tb01")]);
  });

  test("[tb33] ID 上界", () => {
    expect(parseUbb("[tb33]")).toEqual([tag("tb33")]);
  });
});
