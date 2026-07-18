import type { Root } from "mdast";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import { unified } from "unified";

const markdownProcessor = unified().use(remarkParse).use(remarkMath).use(remarkGfm);

export function parseMarkdown(content: string): Root {
  return markdownProcessor.parse(content) as Root;
}
