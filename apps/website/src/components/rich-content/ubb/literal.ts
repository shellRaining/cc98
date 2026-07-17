import { h } from "vue";
import { getUbbTextContent } from "../text";
import MarkdownRenderer from "../markdown/MarkdownRenderer.vue";
import UniversePlainText from "../universe/UniversePlainText.vue";
import UbbCodeBlock from "./UbbCodeBlock.vue";
import type { UbbTagRenderer } from "./types";

export const renderLiteralTag: UbbTagRenderer = (node, context) => {
  const content = getUbbTextContent(node.children);
  if (node.tag === "code") {
    return h(UbbCodeBlock, { code: content });
  }
  if (node.tag === "md" && context.options.allowEmbeddedMarkdown) {
    return h(MarkdownRenderer, { content, options: context.options });
  }
  return h(UniversePlainText, { content });
};
