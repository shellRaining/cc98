import { h } from "vue";
import { getUbbTextContent } from "../text";
import MarkdownRenderer from "../markdown/MarkdownRenderer.vue";
import UniverseCodeBlock from "../universe/UniverseCodeBlock.vue";
import UniversePlainText from "../universe/UniversePlainText.vue";
import type { UbbTagRenderer } from "./types";

export const renderLiteralTag: UbbTagRenderer = (node, context) => {
  const content = getUbbTextContent(node.children);
  if (node.tag === "code") {
    return h(UniverseCodeBlock, {
      code: content,
      language: node.attrs.positionals[0] || undefined,
    });
  }
  if (node.tag === "md" && context.options.allowEmbeddedMarkdown) {
    return h(MarkdownRenderer, { content, options: context.options });
  }
  return h(UniversePlainText, { content });
};
