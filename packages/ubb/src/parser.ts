/**
 * UBB 解析器核心。
 *
 * 建树和容错逻辑移植自 Forum/Ubb/Core.tsx 的 buildSegmentsCore + tryHandleEndTag + forceClose。
 * 两阶段：
 * 1. buildSegments：把字符串解析成中间 segment 树（含容错处理）。
 * 2. segment 树 → AST（UbbNode[]）。
 *
 * 容错行为（与 Core.tsx 一致）：
 * - 未闭合标签：root.close() 时 forceClose 把 startTagString 降级为文本，
 *   子内容提升到父级作为兄弟节点。
 * - 孤立结束标签：tryHandleEndTag 找不到匹配开始标签时，[/x] 作为纯文字。
 * - 未知标签：降级为纯文字。
 * - Text 模式未找到结束标签：startTagString 降级为纯文字。
 * - 标签解析异常（parseTag 抛错）：原始 [tagString] 降级为纯文字。
 */
import type { UbbNode } from "./types.ts";
import { parseUbbTag, type UbbTagData, type UbbTagParser } from "./tag-data.ts";

export type UbbTagMode = "recursive" | "text" | "empty" | "autoclose";

/** 标签名解析结果；family 仅在由标签族匹配时存在。 */
export interface UbbTagSpec {
  readonly mode: UbbTagMode;
  readonly family?: string;
}

type UbbTagResolver = (tagName: string) => UbbTagSpec | null;

interface ParsedTag extends UbbTagData {
  readonly family?: string;
  readonly startTagString: string;
  readonly endTagString: string;
}

/** 文本 segment。 */
interface TextSeg {
  readonly kind: "text";
  readonly value: string;
}

/** 标签 segment。tag 为 null 表示 root 哨兵。 */
interface TagSeg {
  readonly kind: "tag";
  readonly tag: ParsedTag | null;
  /** 标签模式，root 哨兵为 null。 */
  mode: UbbTagMode | null;
  children: Seg[];
  closed: boolean;
  /** 实际匹配到的结束标签原文，保留大小写；没有结束标签时为 null。 */
  closeRaw: string | null;
  parent: TagSeg | null;
}

type Seg = TextSeg | TagSeg;

/**
 * 把 UBB 文本解析成 AST。
 *
 * @param src UBB 原始文本。
 * @returns AST 节点数组。
 */
export interface ParseUbbOptions {
  readonly resolveTag?: UbbTagResolver;
  readonly parseTag?: UbbTagParser;
  readonly mergeAdjacentText?: boolean;
}

export function parseUbb(src: string, options: ParseUbbOptions = {}): UbbNode[] {
  const root: TagSeg = {
    kind: "tag",
    tag: null,
    mode: null,
    children: [],
    closed: false,
    closeRaw: null,
    parent: null,
  };
  // 预计算小写版本，避免 findEndTag/checkEndTag 重复 toLowerCase（O(n²) → O(n)）
  const lowerSrc = src.toLowerCase();
  buildSegments(
    src,
    lowerSrc,
    root,
    options.resolveTag ?? (() => null),
    options.parseTag ?? parseUbbTag,
  );
  closeTag(root);
  return segmentsToAst(root, options.mergeAdjacentText ?? false);
}

/**
 * 主解析循环：构建 segment 树。
 *
 * 移植自 Core.tsx buildSegmentsCore（1178-1303 行）。
 *
 * @param content 原始文本。
 * @param lowerContent content 的小写版本（用于大小写不敏感的结束标签匹配）。
 */
function buildSegments(
  content: string,
  lowerContent: string,
  rootParent: TagSeg,
  resolveTag: UbbTagResolver,
  parseTag: UbbTagParser,
): void {
  let parent = rootParent;
  let cursor = 0;

  while (true) {
    const bracketOpen = content.indexOf("[", cursor);

    // 没有更多 [，剩余内容作为文本
    if (bracketOpen === -1) {
      const remain = content.slice(cursor);
      if (remain) addText(parent, remain);
      return;
    }

    const bracketClose = content.indexOf("]", bracketOpen);

    // 找到 [ 但没有配对的 ]，剩余全部作为文本
    if (bracketClose === -1) {
      const remain = content.slice(cursor);
      if (remain) addText(parent, remain);
      return;
    }

    // 添加 [ 前的文本
    const beforeText = content.slice(cursor, bracketOpen);
    if (beforeText) addText(parent, beforeText);

    const tagString = content.slice(bracketOpen + 1, bracketClose);
    cursor = bracketClose + 1;

    // 检测结束标签 [/xxx]
    const endMatch = tagString.match(/^\/(.+)$/i);
    if (endMatch) {
      parent = tryHandleEndTag(endMatch[1].toLowerCase(), `[${tagString}]`, parent);
      continue;
    }

    // 开始标签：尝试解析
    try {
      const parsed = parseTag(tagString);
      if (!parsed || !parsed.name || /[\s[\]/]/.test(parsed.name)) {
        addText(parent, `[${tagString}]`);
        continue;
      }
      const name = parsed.name.toLowerCase();

      const spec = resolveTag(name);
      if (!spec) {
        // 未知标签，降级为文本
        addText(parent, `[${tagString}]`);
        continue;
      }
      const mode = spec.mode;

      const tag: ParsedTag = {
        ...parsed,
        name,
        family: spec.family,
        startTagString: `[${tagString}]`,
        endTagString: `[/` + name + `]`,
      };

      switch (mode) {
        // autoclose 在解析阶段与 recursive 行为一致：都允许包裹内容、递归建树。
        // 两者的差别在 forceClose（见下方 forceClose 函数的 autoclose 分支）。
        case "recursive":
        case "autoclose": {
          const newTag: TagSeg = {
            kind: "tag",
            tag,
            mode,
            children: [],
            closed: false,
            closeRaw: null,
            parent,
          };
          parent.children.push(newTag);
          parent = newTag;
          break;
        }
        case "text": {
          const endIdx = findEndTag(lowerContent, tag.name, cursor);
          if (endIdx === -1) {
            // 未找到结束标签，降级为文本
            addText(parent, tag.startTagString);
          } else {
            const innerContent = content.slice(cursor, endIdx);
            const closeEnd = endIdx + tag.endTagString.length;
            const newTag: TagSeg = {
              kind: "tag",
              tag,
              mode,
              children: innerContent ? [{ kind: "text", value: innerContent } as TextSeg] : [],
              closed: true,
              closeRaw: content.slice(endIdx, closeEnd),
              parent,
            };
            parent.children.push(newTag);
            cursor = closeEnd;
          }
          break;
        }
        case "empty": {
          // 如果紧跟同名结束标签则一并消费
          const endTagLen = checkEndTag(lowerContent, tag.name, cursor);
          const newTag: TagSeg = {
            kind: "tag",
            tag,
            mode,
            children: [],
            closed: true,
            closeRaw: endTagLen > 0 ? content.slice(cursor, cursor + endTagLen) : null,
            parent,
          };
          parent.children.push(newTag);
          cursor += endTagLen;
          break;
        }
      }
    } catch {
      // parseTag 抛异常，降级为文本
      addText(parent, `[${tagString}]`);
    }
  }
}

/**
 * 尝试找到结束标签对应的开始标签，并关闭它。
 *
 * 移植自 Core.tsx tryHandleEndTag（1153-1171 行）。
 * 从 parent 向上遍历，找到同名标签则 close()，返回其 parent。
 * 找不到则把结束标签原文作为文本添加到 parent。
 */
function tryHandleEndTag(tagName: string, raw: string, parent: TagSeg): TagSeg {
  let p: TagSeg | null = parent;
  while (p && p.tag !== null) {
    if (p.tag.name === tagName) {
      closeTag(p);
      p.closeRaw = raw;
      return p.parent!;
    }
    p = p.parent;
  }
  // 没找到匹配的开始标签
  addText(parent, raw);
  return parent;
}

/**
 * 关闭标签，强制处理所有未关闭的子标签。
 *
 * 移植自 Core.tsx UbbTagSegment.close() + forceClose（349-392 行）。
 */
function closeTag(seg: TagSeg): void {
  const subs = seg.children;
  seg.children = [];
  for (const item of subs) {
    forceClose(item, seg);
  }
  seg.closed = true;
}

/**
 * 强制关闭一个 segment，挂接到新的 parent。
 *
 * 移植自 Core.tsx forceClose（349-376 行），新增 autoclose 支持。
 * 改为迭代实现以避免极端嵌套深度下的栈溢出。
 *
 * - 文本/已关闭标签：直接挂到 newParent。
 * - 未关闭的 autoclose 标签：保留为空标签节点，子段提升到 newParent。
 * - 未关闭的其他标签：startTagString 降级为文本，子内容提升到 newParent。
 */
function forceClose(rootSegment: Seg, newParent: TagSeg): void {
  // 用 FIFO 队列替代递归，保持子段顺序
  const queue: Seg[] = [rootSegment];

  while (queue.length > 0) {
    const segment = queue.shift()!;

    if (segment.kind === "text") {
      newParent.children.push(segment);
      continue;
    }

    // segment.kind === "tag"
    if (segment.tag !== null && segment.closed) {
      // 已关闭的标签正常保留
      segment.parent = newParent;
      newParent.children.push(segment);
      continue;
    }

    // 未关闭的 autoclose 标签（user/topic/board/pm）：保留为空标签节点，
    // 子段提升到 newParent。不降级为文本是为了保住站内链接语义——
    // recursive 分支会把 [user=张三] 还原成纯文字，autoclose 这里保留节点，
    // 让 to-html/to-markdown 仍能识别并输出链接。
    if (segment.tag !== null && segment.mode === "autoclose") {
      const autocloseTag: TagSeg = {
        kind: "tag",
        tag: segment.tag,
        mode: segment.mode,
        children: [],
        closed: true,
        closeRaw: null,
        parent: newParent,
      };
      newParent.children.push(autocloseTag);
      // 子段提升到 newParent（入队列继续处理）
      queue.push(...segment.children);
      continue;
    }

    // 未关闭的其他标签降级：startTagString 变文本，子内容提升
    if (segment.tag !== null) {
      newParent.children.push({ kind: "text", value: segment.tag.startTagString });
    }
    queue.push(...segment.children);
  }
}

/**
 * 大小写不敏感地查找结束标签 [/tagName] 的位置。
 *
 * lowerContent 由调用方预计算（整个 content 的小写版本），避免重复 toLowerCase。
 */
function findEndTag(lowerContent: string, tagName: string, fromIndex: number): number {
  return lowerContent.indexOf(`[/${tagName}]`, fromIndex);
}

/**
 * 检查 cursor 位置是否紧跟 [/tagName]，返回匹配长度（0 表示不匹配）。
 *
 * lowerContent 由调用方预计算。
 */
function checkEndTag(lowerContent: string, tagName: string, cursor: number): number {
  const needle = `[/${tagName}]`;
  if (lowerContent.startsWith(needle, cursor)) {
    return needle.length;
  }
  return 0;
}

/** 向 parent 添加文本 segment。 */
function addText(parent: TagSeg, value: string): void {
  parent.children.push({ kind: "text", value });
}

/**
 * 把 root 的子 segment 转成 AST 节点数组。
 *
 * 使用显式栈的后序遍历，避免极端嵌套深度下的栈溢出。
 */
function segmentsToAst(root: TagSeg, mergeText: boolean): UbbNode[] {
  type Frame = { seg: TagSeg; results: UbbNode[]; nextChild: number };
  const stack: Frame[] = [{ seg: root, results: [], nextChild: 0 }];

  while (true) {
    const top = stack[stack.length - 1];

    // 还有子节点未处理
    if (top.nextChild < top.seg.children.length) {
      const child = top.seg.children[top.nextChild];
      top.nextChild++;

      if (child.kind === "text") {
        pushText(top.results, child.value, mergeText);
      } else {
        // 标签子节点入栈，下一轮处理
        stack.push({ seg: child, results: [], nextChild: 0 });
      }
      continue;
    }

    stack.pop();
    if (stack.length === 0) return top.results;

    // 所有子节点处理完，创建标签 AST 节点
    const tag = top.seg.tag!;
    stack[stack.length - 1].results.push({
      type: "tag",
      tag: tag.name,
      family: tag.family,
      attrs: tag.attrs,
      raw: { open: tag.startTagString, close: top.seg.closeRaw },
      children: top.results,
    });
  }
}

function pushText(results: UbbNode[], value: string, merge: boolean): void {
  const last = results[results.length - 1];
  if (merge && last?.type === "text") {
    results[results.length - 1] = { type: "text", value: last.value + value };
  } else {
    results.push({ type: "text", value });
  }
}
