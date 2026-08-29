export const UBB_VERSION = "0.0.0";

export type { UbbNode, UbbTextNode, UbbTagNode, UbbAttrs } from "./types.ts";

export { resolveUbbEmotionTag } from "./emotion.ts";
export type { UbbEmotionDescriptor } from "./emotion.ts";
export { getUbbTextContent } from "./node-utils.ts";
export { parseUbb } from "./parser.ts";
export type { ParseUbbOptions } from "./parser.ts";
export { createUbbRegistry, defaultUbbRegistry } from "./registry.ts";
export type { UbbRegistry, UbbRegistryOptions, UbbTagModes } from "./registry.ts";
export type {
  UbbRenderer,
  UbbRendererOptions,
  UbbTagHandler,
  UbbTagHandlerProps,
  UbbTagHandlers,
} from "./renderer.ts";
export {
  UBB_REGEX_TAG_FAMILIES,
  UBB_STATIC_TAG_MODES,
  UBB_STATIC_TAG_NAMES,
  matchUbbRegexTagFamily,
} from "./tags.ts";
export type { TagMode, UbbRegexTagFamily, UbbStaticTagName, UbbTagModeResolver } from "./tags.ts";
