import { createUbbRegistry } from "../src/registry.ts";
import { parseTag, extractAttrs } from "./tag-data.ts";
import { getTagMode, UBB_STATIC_TAG_MODES } from "./tags.ts";

export { resolveUbbEmotionTag } from "./emotion.ts";
export type { UbbEmotionDescriptor } from "./emotion.ts";
export {
  UBB_REGEX_TAG_FAMILIES,
  UBB_STATIC_TAG_MODES,
  UBB_STATIC_TAG_NAMES,
  matchUbbRegexTagFamily,
} from "./tags.ts";
export type { UbbRegexTagFamily, UbbStaticTagName } from "./tags.ts";

/** 与旧 CC98 论坛的参数和标签语义一致。 */
export const cc98Registry = createUbbRegistry(UBB_STATIC_TAG_MODES, {
  resolveUnknownTag: getTagMode,
  parseTag: (source) => {
    const tag = parseTag(source);
    return tag ? { name: tag.tagName, attrs: extractAttrs(tag) } : null;
  },
});
