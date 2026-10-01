import type { UbbTagParser } from "../src/tag-data.ts";

/** CC98 参数状态机：保留旧分隔/空白规则，直接产出属性并支持同类引号转义。 */
export const parseCc98Tag: UbbTagParser = (source) => {
  if (!source) return null;
  if (/^[^\s=,"']+$/.test(source)) {
    return { name: source.toLowerCase(), attrs: { positionals: [], named: {} } };
  }
  const positionals: string[] = [];
  const named: Record<string, string> = {};
  let tagName: string | null = null;
  let name: string | null = null;
  let value: string | null = null;
  let last: "separator" | "equals" | "string" = "separator";
  let scanLast: "separator" | "equals" | "string" = "separator";
  let index = 0;
  const settle = () => {
    if (tagName === null) {
      tagName = (name ?? value)?.toLowerCase() ?? "";
      if (name !== null) positionals.push(value ?? "");
    } else if (name !== null) named[name] = value ?? "";
    else positionals.push(value ?? "");
    name = null;
    value = null;
  };
  while (index < source.length) {
    const char = source[index];
    if (/\s/.test(char)) {
      index++;
      continue;
    }
    if (char === ",") {
      settle();
      last = "separator";
      scanLast = "separator";
      index++;
      continue;
    }
    if (char === "=") {
      if (last !== "string") throw new Error("UBB: 参数等号位置非法");
      name = value;
      value = null;
      last = "equals";
      scanLast = "equals";
      index++;
      continue;
    }
    let token: string;
    if (char === '"' || char === "'") {
      let start = ++index;
      const parts: string[] = [];
      while (true) {
        const end = source.indexOf(char, index);
        if (end < 0) {
          parts.push(source.slice(start));
          index = source.length;
          break;
        }
        if (source[end + 1] === char) {
          parts.push(source.slice(start, end), char);
          index = end + 2;
          start = index;
        } else {
          parts.push(source.slice(start, end));
          index = end + 1;
          break;
        }
      }
      token = parts.join("");
    } else {
      const start = index++;
      while (
        index < source.length &&
        source[index] !== "," &&
        (scanLast !== "separator" || source[index] !== "=")
      )
        index++;
      token = source.slice(start, index);
    }
    if (last === "string") throw new Error("UBB: 参数连续出现多个值");
    value = token;
    last = "string";
    scanLast = "string";
  }
  settle();
  if (!tagName) return null;
  return { name: tagName, attrs: { positionals, named } };
};
