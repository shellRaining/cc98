export const UBB_VERSION = "1.0.0";

export type { UbbNode, UbbTextNode, UbbTagNode, UbbAttrs, UbbTagRaw } from "./types.ts";

export { getUbbTextContent } from "./node-utils.ts";
export type { UbbTagMode } from "./parser.ts";
export { parseUbbTag } from "./tag-data.ts";
export type { UbbTagParser, UbbTagData } from "./tag-data.ts";
export { createUbbRegistry } from "./registry.ts";
export type {
  UbbRegistry,
  UbbRegistryConfig,
  UbbRegistryOptions,
  UbbTagFamilies,
  UbbTagFamily,
  UbbTagModes,
} from "./registry.ts";
export type {
  UbbRenderer,
  UbbRendererOptions,
  UbbTagHandler,
  UbbTagHandlerProps,
  UbbTagHandlers,
} from "./renderer.ts";
