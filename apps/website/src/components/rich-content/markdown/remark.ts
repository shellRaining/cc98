import type { Root } from "mdast";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";

const markdownProcessor = unified().use(remarkParse).use(remarkGfm);

export function parseMarkdown(content: string): Root {
  return markdownProcessor.parse(content) as Root;
}
