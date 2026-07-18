import { POST_CONTENT_TYPE, type PostContentType } from "@cc98/api";
import { ubbToMarkdown } from "@cc98/ubb";

export function postExcerpt(
  content: string | undefined,
  contentType: PostContentType | undefined,
  maxLength = 180,
): string {
  const source = content ?? "";
  const markdown = contentType === POST_CONTENT_TYPE.ubb ? ubbToMarkdown(source) : source;
  const text = markdown
    .replace(/!\[[^\]]*]\([^)]*\)/g, "[图片]")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/```[\s\S]*?```/g, "[代码]")
    .replace(/[`*_>#~]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "(无可预览内容)";
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}
