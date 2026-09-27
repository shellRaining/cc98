import { parseUbb, type UbbTagMode, type UbbTagSpec } from "./parser.ts";
import { createUbbRenderer, type UbbRenderer, type UbbRendererOptions } from "./renderer.ts";
import type { UbbTagParser } from "./tag-data.ts";
import type { UbbNode } from "./types.ts";

export type UbbTagModes = Readonly<Record<string, UbbTagMode>>;

/** 按正则匹配一组标签名的标签族，如表情 `[ac01]`、`[ac02]`。 */
export interface UbbTagFamily {
  readonly pattern: RegExp;
  readonly mode: UbbTagMode;
}

export type UbbTagFamilies = Readonly<Record<string, UbbTagFamily>>;

type NormalizeNames<Map> = {
  readonly [Name in keyof Map as Name extends string ? Lowercase<Name> : never]: Map[Name];
};

type FamilyModes<Families extends UbbTagFamilies> = {
  readonly [
    Name in keyof Families as Name extends string ? Lowercase<Name> : never
  ]: Families[Name]["mode"];
};

/** 与标签登记无关的解析配置，可在创建后通过 configure 调整。 */
export interface UbbRegistryConfig {
  /** 自定义 [标签头] 中的名称和参数；默认支持 [tag] 与 [tag=value]。 */
  readonly parseTag?: UbbTagParser;
  /** 把相邻的文本节点合并成一个，例如降级为文本的标签和前后正文。默认 false。 */
  readonly mergeAdjacentText?: boolean;
}

export interface UbbRegistryOptions<
  Tags extends UbbTagModes = UbbTagModes,
  Families extends UbbTagFamilies = UbbTagFamilies,
> extends UbbRegistryConfig {
  /** 精确标签名 → 模式。 */
  readonly tags?: Tags;
  /** 族名 → 匹配规则；精确标签未命中时按登记顺序匹配。 */
  readonly families?: Families;
}

/**
 * 标签注册器。Tags 与 Families 只在类型层面记录已登记的名称和模式，
 * 供 createRenderer 推导 handler 的键。
 */
export interface UbbRegistry<
  Tags extends UbbTagModes = UbbTagModes,
  Families extends UbbTagModes = UbbTagModes,
> {
  register<const Name extends string, const Mode extends UbbTagMode>(
    name: Name,
    mode: Mode,
  ): UbbRegistry<Tags & Readonly<Record<Lowercase<Name>, Mode>>, Families>;
  registerFamily<const Name extends string, const Mode extends UbbTagMode>(
    name: Name,
    pattern: RegExp,
    mode: Mode,
  ): UbbRegistry<Tags, Families & Readonly<Record<Lowercase<Name>, Mode>>>;
  /** 移除一个标签或标签族；名称未注册时抛错。 */
  unregister<const Name extends string>(
    name: Name,
  ): UbbRegistry<Omit<Tags, Lowercase<Name>>, Omit<Families, Lowercase<Name>>>;
  /** 覆盖解析配置，未出现的字段保持不变。 */
  configure(config: UbbRegistryConfig): UbbRegistry<Tags, Families>;
  parse(source: string): UbbNode[];
  createRenderer<Output, Context = void>(
    options: UbbRendererOptions<Tags, Families, Output, Context>,
  ): UbbRenderer<Output, Context>;
}

interface RegistryState extends UbbRegistryConfig {
  readonly tags: ReadonlyMap<string, UbbTagMode>;
  readonly families: ReadonlyMap<string, UbbTagFamily>;
}

function normalizeName(name: string): string {
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

function assertTagMode(mode: unknown): asserts mode is UbbTagMode {
  if (mode !== "recursive" && mode !== "text" && mode !== "empty" && mode !== "autoclose") {
    throw new TypeError(`UBB: 非法标签模式 ${JSON.stringify(mode)}`);
  }
}

function assertPattern(pattern: unknown): asserts pattern is RegExp {
  if (!(pattern instanceof RegExp)) {
    throw new TypeError("UBB: 标签族规则必须是正则表达式");
  }
  // g、y 标志会让 test() 依赖 lastIndex，同一标签名多次匹配结果不一致
  if (pattern.global || pattern.sticky) {
    throw new TypeError(`UBB: 标签族规则 ${pattern} 不能带 g 或 y 标志`);
  }
}

/** 标签和标签族共用 handler 的键，名称不能重复。 */
function assertNameAvailable(state: RegistryState, name: string): void {
  if (state.tags.has(name) || state.families.has(name)) {
    throw new Error(`UBB: 名称 ${name} 已注册`);
  }
}

function withTag(state: RegistryState, name: string, mode: unknown): RegistryState {
  const normalizedName = normalizeName(name);
  assertTagMode(mode);
  assertNameAvailable(state, normalizedName);
  return { ...state, tags: new Map(state.tags).set(normalizedName, mode) };
}

function withFamily(state: RegistryState, name: string, family: UbbTagFamily): RegistryState {
  const normalizedName = normalizeName(name);
  assertPattern(family.pattern);
  assertTagMode(family.mode);
  assertNameAvailable(state, normalizedName);
  return {
    ...state,
    families: new Map(state.families).set(normalizedName, {
      pattern: family.pattern,
      mode: family.mode,
    }),
  };
}

function withoutName(state: RegistryState, name: string): RegistryState {
  const normalizedName = name.toLowerCase();
  if (state.tags.has(normalizedName)) {
    const tags = new Map(state.tags);
    tags.delete(normalizedName);
    return { ...state, tags };
  }
  if (state.families.has(normalizedName)) {
    const families = new Map(state.families);
    families.delete(normalizedName);
    return { ...state, families };
  }
  throw new Error(`UBB: 名称 ${normalizedName} 未注册`);
}

function createRegistry<Tags extends UbbTagModes, Families extends UbbTagModes>(
  state: RegistryState,
): UbbRegistry<Tags, Families> {
  const resolveTag = (tagName: string): UbbTagSpec | null => {
    const mode = state.tags.get(tagName);
    if (mode) return { mode };
    for (const [family, { pattern, mode }] of state.families) {
      if (pattern.test(tagName)) return { mode, family };
    }
    return null;
  };

  const parse = (source: string): UbbNode[] =>
    parseUbb(source, {
      resolveTag,
      parseTag: state.parseTag,
      mergeAdjacentText: state.mergeAdjacentText,
    });

  const registry: UbbRegistry<Tags, Families> = {
    register(name, mode) {
      return createRegistry(withTag(state, name, mode));
    },
    registerFamily(name, pattern, mode) {
      return createRegistry(withFamily(state, name, { pattern, mode }));
    },
    unregister(name) {
      return createRegistry(withoutName(state, name));
    },
    configure(config) {
      return createRegistry({ ...state, ...config, tags: state.tags, families: state.families });
    },
    parse,
    createRenderer(rendererOptions) {
      return createUbbRenderer(parse, rendererOptions);
    },
  };

  return Object.freeze(registry);
}

export function createUbbRegistry<
  const Tags extends UbbTagModes = {},
  const Families extends UbbTagFamilies = {},
>(
  options: UbbRegistryOptions<Tags, Families> = {},
): UbbRegistry<NormalizeNames<Tags>, FamilyModes<Families>> {
  let state: RegistryState = {
    tags: new Map(),
    families: new Map(),
    parseTag: options.parseTag,
    mergeAdjacentText: options.mergeAdjacentText,
  };
  for (const [name, mode] of Object.entries(options.tags ?? {})) {
    state = withTag(state, name, mode);
  }
  for (const [name, family] of Object.entries(options.families ?? {})) {
    state = withFamily(state, name, family);
  }
  return createRegistry(state);
}
