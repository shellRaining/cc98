import type { UbbAttrs } from "./types.ts";

/** 标签头解析成功后的结果。名称由解析器转成小写；attrs 是传给渲染器的参数。 */
export interface UbbTagData {
  readonly name: string;
  readonly attrs: UbbAttrs;
}

/** 接收方括号内的原始内容；无效标签返回 null 或抛错，解析器会保留原文。 */
export type UbbTagParser = (source: string) => UbbTagData | null;

/** 常用的 [tag]、[tag=value] 语法，等号后的值原样保留。 */
export const parseUbbTag: UbbTagParser = (source) => {
  const match = /^([^\s[\]\\/=,]+)(?:=([^[\]]*))?$/.exec(source);
  if (!match) return null;
  return {
    name: match[1].toLowerCase(),
    attrs: { positionals: match[2] === undefined ? [] : [match[2]], named: {} },
  };
};
