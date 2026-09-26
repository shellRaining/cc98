import { parseUbb } from "./parser.ts";
import { createUbbRenderer, type UbbRenderer, type UbbRendererOptions } from "./renderer.ts";
import { type TagMode, type UbbTagModeResolver } from "./parser.ts";
import type { UbbTagParser } from "./tag-data.ts";
import type { UbbNode } from "./types.ts";

export type UbbTagModes = Readonly<Record<string, TagMode>>;

type NormalizeUbbTagModes<Tags extends UbbTagModes> = {
  readonly [Name in keyof Tags as Name extends string ? Lowercase<Name> : never]: Tags[Name];
};

export interface UbbRegistryOptions {
  /** 精确标签未命中时使用，可用于内置正则标签族。 */
  readonly resolveUnknownTag?: UbbTagModeResolver;
  /** 自定义 [标签头] 中的名称和参数；默认支持 [tag] 与 [tag=value]。 */
  readonly parseTag?: UbbTagParser;
}

export interface UbbRegistry<Tags extends UbbTagModes = UbbTagModes> {
  register<const Name extends string, const Mode extends TagMode>(
    name: Name,
    mode: Mode,
  ): UbbRegistry<Tags & Readonly<Record<Lowercase<Name>, Mode>>>;
  parse(source: string): UbbNode[];
  createRenderer<Output, Context = void>(
    options: UbbRendererOptions<Tags, Output, Context>,
  ): UbbRenderer<Output, Context>;
}

function normalizeTagName(name: string): string {
  if (
    !name ||
    name.trim() !== name ||
    name.includes("[") ||
    name.includes("]") ||
    name.includes("/")
  ) {
    throw new TypeError(`UBB: 非法标签名 ${JSON.stringify(name)}`);
  }
  return name.toLowerCase();
}

function assertTagMode(mode: unknown): asserts mode is TagMode {
  if (mode !== "recursive" && mode !== "text" && mode !== "empty" && mode !== "autoclose") {
    throw new TypeError(`UBB: 非法标签模式 ${JSON.stringify(mode)}`);
  }
}

function createRegistry<Tags extends UbbTagModes>(
  tagModes: ReadonlyMap<string, TagMode>,
  options: UbbRegistryOptions,
): UbbRegistry<Tags> {
  const resolveUnknownTag = options.resolveUnknownTag;

  const resolveTagMode = (tagName: string): TagMode | null => {
    const normalizedName = tagName.toLowerCase();
    return tagModes.get(normalizedName) ?? resolveUnknownTag?.(normalizedName) ?? null;
  };

  const parse = (source: string): UbbNode[] =>
    parseUbb(source, { resolveTagMode, parseTag: options.parseTag });

  const registry: UbbRegistry<Tags> = {
    register<const Name extends string, const Mode extends TagMode>(name: Name, mode: Mode) {
      const normalizedName = normalizeTagName(name);
      assertTagMode(mode);
      if (tagModes.has(normalizedName)) {
        throw new Error(`UBB: 标签 ${normalizedName} 已注册`);
      }

      const nextTagModes = new Map(tagModes);
      nextTagModes.set(normalizedName, mode);
      return createRegistry(nextTagModes, options);
    },
    parse,
    createRenderer<Output, Context = void>(
      rendererOptions: UbbRendererOptions<Tags, Output, Context>,
    ) {
      return createUbbRenderer<Tags, Output, Context>(parse, rendererOptions);
    },
  };

  return Object.freeze(registry);
}

export function createUbbRegistry<const InitialTags extends UbbTagModes = {}>(
  initialTags?: InitialTags,
  options: UbbRegistryOptions = {},
): UbbRegistry<NormalizeUbbTagModes<InitialTags>> {
  const tagModes = new Map<string, TagMode>();

  for (const [name, mode] of Object.entries(initialTags ?? {})) {
    const normalizedName = normalizeTagName(name);
    assertTagMode(mode);
    if (tagModes.has(normalizedName)) {
      throw new Error(`UBB: 标签 ${normalizedName} 已注册`);
    }
    tagModes.set(normalizedName, mode);
  }

  return createRegistry<NormalizeUbbTagModes<InitialTags>>(tagModes, options);
}
