const mixedParagraph = [
  "[b]标题文字[/b]这里是正文内容，包含一些[i]斜体[/i]和[u]下划线[/u]以及[del]删除线[/del]。",
  "[size=5][color=red]红色大字[/color][/size]普通文字[size=3][color=blue]蓝色小字[/color][/size]。",
  "链接测试：[url=https://cc98.org]论坛首页[/url] 和 [url]https://example.com[/url]。",
  "表情测试：[ac01][ac02][ac03][em01][em02][ms01][cc9801][tb01]。",
  "[quote=某人][b]引用内容[/b]这里是引用的正文。[/quote]",
  "[code]function hello() {\n  console.log('hello world');\n  return [1, 2, 3];\n}[/code]",
  "[table][tr][th]列A[/th][th]列B[/th][/tr][tr][td]值1[/td][td]值2[/td][/tr][/table]",
  "[img]https://example.com/photo.jpg[/img][video]https://example.com/video.mp4[/video]",
  "[md]# Markdown 标题\n\n- 列表项一\n- 列表项二\n\n**粗体** 和 _斜体_。[/md]",
  "[noubb][b]这里不被解析[/b]原始内容保留[/noubb]",
  "[math]E=mc^2[/math] [m]x_{n+1}[/m] 数学公式测试。",
  "[user=张三] [topic=12345]帖子标题[/topic] [board=678]板块名[/board] [pm=李四]",
  "[align=center]居中文本[/align][left]左对齐[/left][right]右对齐[/right]",
  "[b][i][u][del]四层嵌套文本内容[/del][/u][/i][/b]",
  "[upload=jpg]https://example.com/upload.jpg[/upload][audio]https://example.com/audio.mp3[/audio]",
].join("\n\n");

export function createMixedSample(repeats: number): string {
  return mixedParagraph.repeat(repeats);
}

export function createPlainTextSample(repeats: number): string {
  return "这是一段不包含 UBB 标签的普通文本，用来分离字符串扫描和 AST 节点构造成本。\n".repeat(
    repeats,
  );
}

export function createDenseTagSample(repeats: number): string {
  return "[b]粗体[/b][i]斜体[/i][ac01][line]".repeat(repeats);
}

export function formatUtf8Size(source: string): string {
  const bytes = Buffer.byteLength(source);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MiB`;
}
