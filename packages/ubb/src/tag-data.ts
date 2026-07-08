/**
 * UBB 标签字符串解析器。
 *
 * 移植自 Forum/Ubb/Core.tsx 的 UbbTagData.parse（520-692 行）。
 * 把方括号内的字符串（如 "color=red"、"upload=jpg,1"、"img=1,title=标题"）
 * 解析成标签名和参数列表，供主解析器提取 AST 属性。
 *
 * tokenizer 规则（与 Core.tsx 一致）：
 * - 逗号 , 是项目分隔符（ItemSep），等号 = 是名称值分隔符（NameValueSep）。
 * - scanToken 根据上一个 token 类型决定当前值的终止符：
 *   ItemSep 后 matchExp=/[=,]/（值可被 = 或 , 终止，= 表示值是参数名）；
 *   其他（NameValueSep）后 matchExp=/,/（值只能被 , 终止，值内部的 = 不算分隔符）。
 *   这保证 [url=https://x.com] 的 URL 中的 = 不被误截。
 * - 单双引号包裹的内容整体作为一个 token，引号被剥离。
 * - 空白字符被跳过。
 *
 * convertTokens 规则：
 * - ItemSep：结算当前参数（push），重置。
 * - NameValueSep：把当前值提升为参数名（lastName = lastValue）。
 * - String：设置当前值（lastValue）。
 * - 第一个参数特殊处理：若 name 为 null，则把 value 当作 tagName（name=value, value=null）。
 */
import type { UbbAttrs } from "./types.ts";

/** 符号类型。 */
type TokenType = "string" | "item-sep" | "name-value-sep";

/** 单个参数（name 为 null 表示位置参数）。 */
interface TagParameter {
  name: string | null;
  value: string | null;
}

/** 解析后的标签数据。 */
export interface ParsedTag {
  /** 标签名（已小写归一化）。 */
  tagName: string;
  /** 原始标签字符串（方括号内的内容，未归一化）。 */
  originalString: string;
  /** 参数列表。 */
  parameters: TagParameter[];
  /** 开始标记字符串，如 "[color=red]"。 */
  startTagString: string;
  /** 结束标记字符串，如 "[/color]"。 */
  endTagString: string;
}

/**
 * 解析标签字符串（方括号内的内容）。
 *
 * @param tagString 方括号内的原始字符串，如 "color=red"。
 * @returns 解析结果；无法解析时返回 null。
 */
export function parseTag(tagString: string): ParsedTag | null {
  if (!tagString) return null;

  const tokens = tokenize(tagString);
  if (tokens.length === 0) return null;

  const parameters = convertTokens(tokens, tagString);
  if (parameters.length === 0) return null;

  const tagName = parameters[0].name!.toLowerCase();

  return {
    tagName,
    originalString: tagString,
    parameters,
    startTagString: `[${tagString}]`,
    endTagString: `[/${tagName}]`,
  };
}

/**
 * 词法扫描：把标签字符串切成 token 序列。
 */
function tokenize(str: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  let lastTokenType: TokenType = "item-sep";

  while (index < str.length) {
    const c = str[index];

    // 空白字符跳过
    if (/\s/.test(c)) {
      index++;
      continue;
    }

    if (c === ",") {
      tokens.push({ type: "item-sep", value: null });
      lastTokenType = "item-sep";
      index++;
      continue;
    }

    if (c === "=") {
      tokens.push({ type: "name-value-sep", value: null });
      lastTokenType = "name-value-sep";
      index++;
      continue;
    }

    if (c === '"' || c === "'") {
      // 引号内容整体作为一个 token
      const end = str.indexOf(c, index + 1);
      const actualEnd = end < 0 ? str.length : end;
      const value = str.slice(index + 1, actualEnd);
      tokens.push({ type: "string", value });
      lastTokenType = "string";
      index = actualEnd + 1;
      continue;
    }

    // 普通文本值：扫描到下一个分隔符
    const matchExp = lastTokenType === "item-sep" ? /[=,]/ : /,/;
    const rest = str.slice(index + 1);
    const match = rest.match(matchExp);
    if (match) {
      const end = index + 1 + match.index!;
      tokens.push({ type: "string", value: str.slice(index, end) });
      lastTokenType = "string";
      index = end;
    } else {
      tokens.push({ type: "string", value: str.slice(index) });
      lastTokenType = "string";
      index = str.length;
    }
  }

  return tokens;
}

interface Token {
  type: TokenType;
  value: string | null;
}

/**
 * 令牌转换：把 token 序列转成参数列表。
 *
 * 移植自 Core.tsx convertTokens（641-691 行）。
 * 容错策略与 Core.tsx 一致：解析异常时抛出，由主循环 catch 后降级为文本。
 */
function convertTokens(tokens: Token[], tagString: string): TagParameter[] {
  const parameters: TagParameter[] = [];
  let lastName: string | null = null;
  let lastValue: string | null = null;
  let lastTokenType: TokenType = "item-sep";

  for (const token of tokens) {
    switch (token.type) {
      case "item-sep":
        parameters.push({ name: lastName, value: lastValue });
        lastName = null;
        lastValue = null;
        lastTokenType = "item-sep";
        break;
      case "name-value-sep":
        if (lastTokenType !== "string") {
          throw new Error(`UBB: 标签字符串 ${tagString} 中 = 位置非法`);
        }
        lastName = lastValue;
        lastValue = null;
        lastTokenType = "name-value-sep";
        break;
      default:
        if (lastTokenType === "string") {
          throw new Error(`UBB: 标签字符串 ${tagString} 中连续出现多个值`);
        }
        lastValue = token.value;
        lastTokenType = "string";
        break;
    }
  }

  // 结算最后一个参数
  parameters.push({ name: lastName, value: lastValue });

  // 第一个参数特殊处理：无 name 时，把 value 当作 tagName
  if (parameters[0].name === null) {
    parameters[0] = { name: parameters[0].value, value: null };
  } else if (parameters[0].value === null) {
    // 有等号（name 已从 value 提升）但等号后无值，保留空字符串
    parameters[0].value = "";
  }

  return parameters;
}

/**
 * 从 ParsedTag 提取 AST 属性。
 *
 * 映射规则：
 * - parameters[0]（tagName 参数）：value 非 null 时加入 positionals[0]。
 * - parameters[1..n]：name 非 null → named[name]=value；name 为 null → positionals.push(value)。
 * - null value 统一转为空字符串（仅在非首位位置参数出现时）。
 */
export function extractAttrs(tag: ParsedTag): UbbAttrs {
  const positionals: string[] = [];
  const named: Record<string, string> = {};

  for (let i = 0; i < tag.parameters.length; i++) {
    const p = tag.parameters[i];
    if (i === 0) {
      if (p.value !== null) {
        positionals.push(p.value);
      }
    } else if (p.name !== null) {
      named[p.name] = p.value ?? "";
    } else {
      positionals.push(p.value ?? "");
    }
  }

  return { positionals, named };
}
