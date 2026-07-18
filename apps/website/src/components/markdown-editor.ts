function escapeMarkdownLabel(value: string): string {
  return value
    .replace(/\r?\n/g, " ")
    .replaceAll("\\", "\\\\")
    .replaceAll("[", "\\[")
    .replaceAll("]", "\\]");
}

export function createAttachmentMarkdown(fileNames: string[], urls: string[]): string {
  if (fileNames.length !== urls.length) throw new Error("附件上传结果数量不一致");
  return fileNames
    .map((fileName, index) => `[${escapeMarkdownLabel(fileName)}](${urls[index]})`)
    .join("\n");
}

export function appendMarkdownBlock(content: string, block: string): string {
  if (!content) return block;
  if (content.endsWith("\n\n")) return `${content}${block}`;
  if (content.endsWith("\n")) return `${content}\n${block}`;
  return `${content}\n\n${block}`;
}
