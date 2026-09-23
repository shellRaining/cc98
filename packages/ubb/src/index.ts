export const UBB_VERSION = "0.0.0";

export type { UbbNode, UbbTextNode, UbbTagNode, UbbAttrs } from "./types.ts";

export { getUbbTextContent } from "./node-utils.ts";
export { parseUbb } from "./parser.ts";
export type { ParseUbbOptions, TagMode, UbbTagModeResolver } from "./parser.ts";
export { parseUbbTag } from "./tag-data.ts";
export type { UbbTagParser, UbbTagData } from "./tag-data.ts";
export { createUbbRegistry } from "./registry.ts";
export type { UbbRegistry, UbbRegistryOptions, UbbTagModes } from "./registry.ts";
export type {
  UbbRenderer,
  UbbRendererOptions,
  UbbTagHandler,
  UbbTagHandlerProps,
  UbbTagHandlers,
} from "./renderer.ts";
