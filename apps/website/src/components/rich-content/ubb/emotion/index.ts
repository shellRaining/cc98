import { h } from "vue";
import { resolveUbbEmotionTag } from "@cc98/ubb";
import { getOriginalUbbTag } from "../../text";
import type { UbbTagRenderer } from "../types";
import UbbEmotion from "./UbbEmotion.vue";

export const renderEmotionTag: UbbTagRenderer = (node, context) => {
  if (!context.options.allowEmotion) return getOriginalUbbTag(node.tag);
  const emotion = resolveUbbEmotionTag(node.tag);
  return emotion ? h(UbbEmotion, { emotion }) : getOriginalUbbTag(node.tag);
};
