import { createUbbRegistry } from "../src/registry.ts";
import { parseCc98Tag } from "./tag-data.ts";
import { UBB_STATIC_TAG_MODES, UBB_TAG_FAMILIES } from "./tags.ts";

export {
  listUbbEmotions,
  resolveUbbEmotionTag,
  ubbEmotionDisplayName,
  UBB_EMOTION_FAMILIES,
} from "./emotion.ts";
export type { UbbEmotionDescriptor, UbbEmotionFamily } from "./emotion.ts";
export { parseCc98Tag } from "./tag-data.ts";
export {
  UBB_STATIC_TAG_MODES,
  UBB_STATIC_TAG_NAMES,
  UBB_TAG_FAMILIES,
  UBB_TAG_FAMILY_NAMES,
} from "./tags.ts";
export type { UbbStaticTagName, UbbTagFamilyName } from "./tags.ts";

/** 与旧 CC98 论坛的参数和标签语义一致。 */
export const cc98Registry = createUbbRegistry({
  tags: UBB_STATIC_TAG_MODES,
  families: UBB_TAG_FAMILIES,
  parseTag: parseCc98Tag,
});
