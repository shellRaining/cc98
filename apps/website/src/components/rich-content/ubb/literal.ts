import { h } from "vue";
import MarkdownRenderer from "../markdown/MarkdownRenderer.vue";
import UniversePlainText from "../universe/UniversePlainText.vue";
import UbbCodeBlock from "./UbbCodeBlock.vue";
import type { UbbTagRenderer } from "./types";

export const renderLiteralTag: UbbTagRenderer = ({ node, textContent, context }) => {
  if (node.tag === "code") {
    return [h(UbbCodeBlock, { code: textContent })];
  }
  if (node.tag === "md" && context.options.allowEmbeddedMarkdown) {
    return [h(MarkdownRenderer, { content: textContent, options: context.options })];
  }
  return [h(UniversePlainText, { content: textContent })];
};
