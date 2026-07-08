/**
 * UBB 解析器核心。
 *
 * 移植自 Forum/Ubb/Core.tsx 的 buildSegmentsCore + tryHandleEndTag + forceClose。
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
import { type ParsedTag, parseTag, extractAttrs } from "./tag-data.ts";
import { getTagMode } from "./tags.ts";

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
  mode: import("./tags.ts").TagMode | null;
  children: Seg[];
  closed: boolean;
  parent: TagSeg | null;
}

type Seg = TextSeg | TagSeg;

/**
 * 把 UBB 文本解析成 AST。
 *
 * @param src UBB 原始文本。
 * @returns AST 节点数组。
 */
export function parseUbb(src: string): UbbNode[] {
  const root: TagSeg = {
    kind: "tag",
    tag: null,
    mode: null,
    children: [],
    closed: false,
    parent: null,
  };
  buildSegments(src, root);
  closeTag(root);
  return root.children.map(segToAst);
}

/**
 * 主解析循环：构建 segment 树。
 *
 * 移植自 Core.tsx buildSegmentsCore（1178-1303 行）。
 */
function buildSegments(content: string, rootParent: TagSeg): void {
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
      const endTagName = endMatch[1].toLowerCase();
      parent = tryHandleEndTag(endTagName, parent);
      continue;
    }

    // 开始标签：尝试解析
    try {
      const tag = parseTag(tagString);
      if (!tag) {
        addText(parent, `[${tagString}]`);
        continue;
      }

      const mode = getTagMode(tag.tagName);
      if (!mode) {
        // 未知标签，降级为文本
        addText(parent, tag.startTagString);
        continue;
      }

      switch (mode) {
        case "recursive":
        case "autoclose": {
          const newTag: TagSeg = {
            kind: "tag",
            tag,
            mode,
            children: [],
            closed: false,
            parent,
          };
          parent.children.push(newTag);
          parent = newTag;
          break;
        }
        case "text": {
          const endIdx = findEndTag(content, tag.tagName, cursor);
          if (endIdx === -1) {
            // 未找到结束标签，降级为文本
            addText(parent, tag.startTagString);
          } else {
            const innerContent = content.slice(cursor, endIdx);
            const newTag: TagSeg = {
              kind: "tag",
              tag,
              mode,
              children: innerContent ? [{ kind: "text", value: innerContent } as TextSeg] : [],
              closed: true,
              parent,
            };
            parent.children.push(newTag);
            cursor = endIdx + tag.endTagString.length;
          }
          break;
        }
        case "empty": {
          const newTag: TagSeg = {
            kind: "tag",
            tag,
            mode,
            children: [],
            closed: true,
            parent,
          };
          parent.children.push(newTag);
          // 如果紧跟同名结束标签则跳过
          const endTagLen = checkEndTag(content, tag.tagName, cursor);
          if (endTagLen > 0) {
            cursor += endTagLen;
          }
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
 * 找不到则把 [/tagName] 作为文本添加到 parent。
 */
function tryHandleEndTag(tagName: string, parent: TagSeg): TagSeg {
  let p: TagSeg | null = parent;
  while (p && p.tag !== null) {
    if (p.tag.tagName === tagName) {
      closeTag(p);
      return p.parent!;
    }
    p = p.parent;
  }
  // 没找到匹配的开始标签
  addText(parent, `[/${tagName}]`);
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
 * - 文本/已关闭标签：克隆后挂到 newParent。
 * - 未关闭的 autoclose 标签：保留为标签节点，子段 forceClose 后留在标签下。
 * - 未关闭的其他标签：startTagString 降级为文本，子内容递归 forceClose 提升到 newParent。
 */
function forceClose(segment: Seg, newParent: TagSeg): void {
  if (segment.kind === "text") {
    newParent.children.push(segment);
    return;
  }

  // segment.kind === "tag"
  if (segment.tag !== null && segment.closed) {
    // 已关闭的标签正常保留
    segment.parent = newParent;
    newParent.children.push(segment);
    return;
  }

  // 未关闭的 autoclose 标签：保留为标签节点
  if (segment.tag !== null && segment.mode === "autoclose") {
    segment.parent = newParent;
    segment.closed = true;
    // 子段在标签下 forceClose（保留层级）
    const subs = segment.children;
    segment.children = [];
    for (const sub of subs) {
      forceClose(sub, segment);
    }
    newParent.children.push(segment);
    return;
  }

  // 未关闭的其他标签降级：startTagString 变文本，子内容提升
  if (segment.tag !== null) {
    newParent.children.push({ kind: "text", value: segment.tag.startTagString });
  }
  for (const sub of segment.children) {
    forceClose(sub, newParent);
  }
}

/**
 * 大小写不敏感地查找结束标签 [/tagName] 的位置。
 */
function findEndTag(content: string, tagName: string, fromIndex: number): number {
  const lower = content.toLowerCase();
  const needle = `[/${tagName}]`;
  return lower.indexOf(needle, fromIndex);
}

/**
 * 检查 cursor 位置是否紧跟 [/tagName]，返回匹配长度（0 表示不匹配）。
 */
function checkEndTag(content: string, tagName: string, cursor: number): number {
  const needle = `[/${tagName}]`;
  const lower = content.toLowerCase();
  if (lower.startsWith(needle, cursor)) {
    return needle.length;
  }
  return 0;
}

/** 向 parent 添加文本 segment。 */
function addText(parent: TagSeg, value: string): void {
  parent.children.push({ kind: "text", value });
}

/**
 * 把 segment 转成 AST 节点。
 */
function segToAst(seg: Seg): UbbNode {
  if (seg.kind === "text") {
    return { type: "text", value: seg.value };
  }

  // seg.kind === "tag"，tag 不为 null（root 哨兵不会出现在 children 里）
  const tagSeg = seg as TagSeg;
  const tag = tagSeg.tag!;

  return {
    type: "tag",
    tag: tag.tagName,
    attrs: extractAttrs(tag),
    children: tagSeg.children.map(segToAst),
  };
}
