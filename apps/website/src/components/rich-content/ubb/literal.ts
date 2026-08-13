import { h } from "vue";
import MarkdownRenderer from "../markdown/MarkdownRenderer.vue";
import UniversePlainText from "../universe/UniversePlainText.vue";
import UbbCodeBlock from "./UbbCodeBlock.vue";
import type { UbbTagRenderer } from "./types";

export const renderLiteralTag: UbbTagRenderer = ({ node, text, context }) => {
  if (node.tag === "code") {
    return [h(UbbCodeBlock, { code: text })];
  }
  if (node.tag === "md" && context.options.allowEmbeddedMarkdown) {
    return [h(MarkdownRenderer, { content: text, options: context.options })];
  }
  return [h(UniversePlainText, { content: text })];
};
