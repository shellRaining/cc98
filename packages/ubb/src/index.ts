export const UBB_VERSION = "0.0.0";

export type { UbbNode, UbbTextNode, UbbTagNode, UbbAttrs } from "./types.ts";

export { parseUbb } from "./parser.ts";
export { ubbToMarkdown } from "./to-markdown.ts";
export { ubbToHtml } from "./to-html.ts";

export type UbbRenderOptions = {
  allowImage: boolean;
  allowExternalUrl: boolean;
  allowMediaContent: boolean;
};

export const defaultUbbOptions: UbbRenderOptions = {
  allowImage: true,
  allowExternalUrl: true,
  allowMediaContent: true,
};

export function createUbbEngine(_options: Partial<UbbRenderOptions> = {}): {
  options: UbbRenderOptions;
} {
  return {
    options: { ...defaultUbbOptions, ..._options },
  };
}
