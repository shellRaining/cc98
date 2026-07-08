export type LegacyUbbParseCase = {
  name: string;
  source: string;
  input: string;
  expected: string;
  note: string;
};

export const legacyTagDataCases: LegacyUbbParseCase[] = [
  {
    name: "解析 url 主值",
    source: "Forum/Ubb/Core.tsx UbbTagData.parse",
    input: "url=https://cc98.org",
    expected: "tag=url mainValue=https://cc98.org attrs={}",
    note: "第一个参数的名称是标签名，等号后的值是 mainValue。",
  },
  {
    name: "解析 img 命名参数",
    source: "Forum/Ubb/ImageTagHandler.tsx",
    input: 'img=1,title="图片标题"',
    expected: 'tag=img mainValue=1 attrs={title:"图片标题"}',
    note: "图片是否默认显示来自 mainValue，标题来自命名参数 title。",
  },
  {
    name: "解析 color 主值",
    source: "Forum/Ubb/ColorTagHandler.tsx",
    input: "color=red",
    expected: "tag=color mainValue=red attrs={}",
    note: "样式类标签通常使用 mainValue 表达配置。",
  },
];

export const legacySegmentCases: LegacyUbbParseCase[] = [
  {
    name: "递归解析嵌套样式标签",
    source: "Forum/Ubb/Core.tsx RecursiveTagHandler",
    input: "[b]粗体[i]斜体[/i][/b]",
    expected: "tag(b)[text(粗体), tag(i)[text(斜体)]]",
    note: "b/i 等样式标签递归解析内部内容。",
  },
  {
    name: "文本标签不递归解析内部内容",
    source: "Forum/Ubb/Core.tsx TextTagHandler",
    input: "[code][b]不递归[/b][/code]",
    expected: "tag(code, text)[text([b]不递归[/b])]",
    note: "code/noubb/md 等文本标签内部不继续构建子标签。",
  },
  {
    name: "空标签支持显式或隐式配对",
    source: "Forum/Ubb/Core.tsx UbbEmptyTagSegment",
    input: "[ac01][em12][/em12]",
    expected: "empty(ac01, implicit), empty(em12, explicit)",
    note: "表情类标签不需要显式闭合，若紧跟结束标签则标记为显式配对。",
  },
  {
    name: "未闭合标签降级为文本",
    source: "Forum/Ubb/Core.tsx UbbTagSegment.forceClose",
    input: "[b]没有闭合",
    expected: "text([b]没有闭合) warning(unclosed b)",
    note: "老项目会把未正确关闭的标签转换为纯文字。",
  },
  {
    name: "孤立结束标签保留为文本",
    source: "Forum/Ubb/Core.tsx tryHandleEndTag",
    input: "孤立[/b]",
    expected: "text(孤立[/b]) warning(orphan end b)",
    note: "找不到开始标签的结束标签按普通文字处理。",
  },
  {
    name: "未知标签保留为文本",
    source: "Forum/Ubb/Core.tsx buildSegmentsCore",
    input: "[foo]内容[/foo]",
    expected: "text([foo]内容[/foo]) warning(unknown foo)",
    note: "没有 handler 的标签不能吞掉用户内容。",
  },
];
