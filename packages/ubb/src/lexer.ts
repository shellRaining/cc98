/** 标签头边界规则；quoted 只在参数值起始处识别引号。 */
export type UbbTagSyntax = "literal" | "quoted";

export interface UbbSourceRange {
  readonly start: number;
  readonly end: number;
}

/** 所有偏移均来自原文，缓存仅存活于一次解析。 */
export function createUbbScanner(source: string, syntax: UbbTagSyntax) {
  const missingQuotes = new Map<string, number>();
  const endings = new Map<string, UbbSourceRange[]>();
  const endingCursors = new Map<string, number>();
  let searchCursor = 0;
  let closingBracket = -1;
  let exhausted = false;

  function headerEnd(open: number): number {
    const first = source.indexOf("]", open + 1);
    if (first < 0 || syntax === "literal" || source[open + 1] === "/") return first;
    let valueStart = false;
    for (let i = open + 1; i < source.length; i++) {
      const char = source[i];
      if (char === "]") return i;
      if (char === "=" || char === ",") {
        valueStart = true;
        continue;
      }
      if (valueStart && /\s/.test(char)) continue;
      if (valueStart && (char === '"' || char === "'")) {
        const missingFrom = missingQuotes.get(char);
        if (missingFrom !== undefined && i >= missingFrom) return first;
        let end = i + 1;
        while (true) {
          end = source.indexOf(char, end);
          if (end < 0) {
            missingQuotes.set(char, i);
            return first;
          }
          if (source[end + 1] !== char) break;
          end += 2;
        }
        i = end;
      } else if (valueStart) {
        // 普通值跳到下一个状态分隔符；保留值中等号触发引号的历史边界语义。
        const boundary = i < first ? first : source.indexOf("]", i);
        if (boundary < 0) return first;
        const rest = source.slice(i, boundary);
        const next = rest.search(/[=,]/);
        if (next < 0) return boundary;
        i += next - 1;
      }
      valueStart = false;
    }
    return first;
  }

  function findEnd(name: string, from: number): UbbSourceRange | undefined {
    const ranges = endings.get(name);
    let index = endingCursors.get(name) ?? 0;
    if (ranges) {
      while (index < ranges.length && ranges[index].start < from) index++;
      endingCursors.set(name, index);
      if (index < ranges.length) return ranges[index];
    }
    if (exhausted) return undefined;
    searchCursor = Math.max(searchCursor, from);
    while (true) {
      const start = source.indexOf("[/", searchCursor);
      if (start < 0) {
        exhausted = true;
        return undefined;
      }
      if (closingBracket < start + 2) closingBracket = source.indexOf("]", start + 2);
      const end = closingBracket;
      if (end < 0) {
        exhausted = true;
        return undefined;
      }
      // 内层 [/ 也可能是合法结束标记；全局游标只前进，失败搜索不会重扫余文。
      searchCursor = start + 2;
      const nested = source.indexOf("[", start + 2);
      if (nested >= 0 && nested < end) continue;
      const candidate = source.slice(start + 2, end);
      if (!candidate || /[\s[\]/]/.test(candidate)) continue;
      const key = candidate.toLowerCase();
      const cached = endings.get(key);
      const range = { start, end: end + 1 };
      if (cached) cached.push(range);
      else endings.set(key, [range]);
      if (key === name) return range;
    }
  }

  function adjacentEnd(name: string, from: number): UbbSourceRange | undefined {
    if (!source.startsWith("[/", from)) return undefined;
    const end = source.indexOf("]", from + 2);
    if (end < 0 || source.slice(from + 2, end).toLowerCase() !== name) return undefined;
    return { start: from, end: end + 1 };
  }

  return { headerEnd, findEnd, adjacentEnd };
}
