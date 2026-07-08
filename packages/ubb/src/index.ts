export const UBB_VERSION = "0.0.0";

export type { UbbNode, UbbTextNode, UbbTagNode, UbbAttrs } from "./types.ts";

/**
 * 把 UBB 文本解析成 AST。
 *
 * 尚未实现，当前为 TDD 红阶段占位。
 * 实现见 docs/exec-plans/2026-07-08-ubb-migration.md 阶段 1。
 */
export function parseUbb(_src: string): import("./types.ts").UbbNode[] {
  throw new Error("parseUbb 尚未实现");
}

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

export function ubbToMarkdown(ubb: string): string {
  return ubb
    .replace(/\[b\](.*?)\[\/b\]/gi, "**$1**")
    .replace(/\[i\](.*?)\[\/i\]/gi, "_$1_")
    .replace(/\[u\](.*?)\[\/u\]/gi, "$1")
    .replace(/\[del\](.*?)\[\/del\]/gi, "~~$1~~")
    .replace(/\[color=[^\]]*\](.*?)\[\/color\]/gis, "$1")
    .replace(/\[size=[^\]]*\](.*?)\[\/size\]/gis, "$1")
    .replace(/\[font=[^\]]*\](.*?)\[\/font\]/gis, "$1")
    .replace(/\[url=([^\]]*)\](.*?)\[\/url\]/gi, "[$2]($1)")
    .replace(/\[img\](.*?)\[\/img\]/gi, "![]($1)")
    .replace(/\[quote\]/gi, "\n> ")
    .replace(/\[\/quote\]/gi, "\n")
    .replace(/\[ac\d+\]/gi, "");
}
