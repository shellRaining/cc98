import { h } from "vue";
import { getOriginalUbbTag } from "../../text";
import type { UbbTagRenderer } from "../types";
import UbbEmotion from "./UbbEmotion.vue";
import { resolveEmotionTag } from "./resolveEmotionTag";

export const renderEmotionTag: UbbTagRenderer = (node, context) => {
  if (!context.options.allowEmotion) return getOriginalUbbTag(node.tag);
  const emotion = resolveEmotionTag(node.tag);
  return emotion ? h(UbbEmotion, { emotion }) : getOriginalUbbTag(node.tag);
};

export { resolveEmotionTag } from "./resolveEmotionTag";
