import { createUbbScanner, type UbbTagSyntax } from "./lexer.ts";
import { parseUbbTag, type UbbTagParser } from "./tag-data.ts";
import type { UbbNode, UbbTagNode } from "./types.ts";

export type UbbTagMode = "recursive" | "text" | "empty" | "autoclose";

export interface UbbTagSpec {
  readonly mode: UbbTagMode;
  readonly family?: string;
}

export interface ParseUbbOptions {
  readonly resolveTag?: (name: string) => UbbTagSpec | null;
  readonly parseTag?: UbbTagParser;
  readonly mergeAdjacentText?: boolean;
  readonly tagSyntax?: UbbTagSyntax;
}

interface Pending {
  readonly pending: true;
  readonly node: UbbTagNode;
  readonly mode: UbbTagMode;
  readonly parent: Frame;
  previous?: Pending;
  children: Entry[];
  unresolved: boolean;
}

type Entry = UbbNode | Pending;
interface Frame {
  children: Entry[];
  unresolved: boolean;
}

function isPending(entry: Entry): entry is Pending {
  return "pending" in entry;
}

/** 未闭合节点只展开一次，已完成子树直接保留。 */
function finishChildren(children: Entry[], unresolved: boolean): UbbNode[] {
  if (!unresolved) return children as UbbNode[];
  const result: UbbNode[] = [];
  const frames = [{ children, next: 0 }];
  while (frames.length) {
    const frame = frames[frames.length - 1];
    if (frame.next === frame.children.length) {
      frames.pop();
      continue;
    }
    const entry = frame.children[frame.next++];
    if (!isPending(entry)) {
      result.push(entry);
      continue;
    }
    if (entry.mode === "autoclose") result.push({ ...entry.node, children: [] });
    else result.push({ type: "text", value: entry.node.raw.open });
    frames.push({ children: entry.children, next: 0 });
  }
  return result;
}

/** 合并以文本段为单位一次拼接，保持标签阻断和默认文本边界。 */
function mergeText(root: UbbNode[]): void {
  const stack = [root];
  while (stack.length) {
    const nodes = stack.pop()!;
    const result: UbbNode[] = [];
    let parts: string[] = [];
    const flush = () => {
      if (parts.length) result.push({ type: "text", value: parts.join("") });
      parts = [];
    };
    for (const node of nodes) {
      if (node.type === "text") parts.push(node.value);
      else {
        flush();
        result.push(node);
        stack.push(node.children);
      }
    }
    flush();
    nodes.length = 0;
    for (const node of result) nodes.push(node);
  }
}

export function parseUbb(source: string, options: ParseUbbOptions = {}): UbbNode[] {
  const root: Frame = { children: [], unresolved: false };
  let current: Frame = root;
  let active: Map<string, Pending> | undefined;
  const scanner = createUbbScanner(source, options.tagSyntax ?? "literal");
  const parseTag = options.parseTag ?? parseUbbTag;
  let cursor = 0;
  const addText = (value: string) => {
    if (value) current.children.push({ type: "text", value });
  };
  const retire = (frame: Pending) => {
    if (!active) return;
    if (frame.previous) active.set(frame.node.tag, frame.previous);
    else active.delete(frame.node.tag);
  };

  while (cursor < source.length) {
    const open = source.indexOf("[", cursor);
    const close = open < 0 ? -1 : scanner.headerEnd(open);
    if (close < 0) {
      addText(source.slice(cursor));
      break;
    }
    addText(source.slice(cursor, open));
    const isEnd = source.charCodeAt(open + 1) === 47 && close > open + 2;
    const header = isEnd ? "" : source.slice(open + 1, close);
    const raw = source.slice(open, close + 1);
    cursor = close + 1;
    if (isEnd) {
      const endName = source.slice(open + 2, close).toLowerCase();
      let target: Pending | undefined;
      if (current !== root && (current as Pending).node.tag === endName) {
        target = current as Pending;
      } else {
        // 正常嵌套只访问栈顶；首次错配才建立同名链，随后保持恢复路径的常数查找。
        if (!active) {
          active = new Map();
          const frames: Pending[] = [];
          let frame = current;
          while (frame !== root) {
            frames.push(frame as Pending);
            frame = (frame as Pending).parent;
          }
          for (let i = frames.length - 1; i >= 0; i--) {
            const pending = frames[i];
            pending.previous = active.get(pending.node.tag);
            active.set(pending.node.tag, pending);
          }
        }
        target = active.get(endName);
      }
      if (!target) {
        addText(raw);
        continue;
      }
      while (current !== target) {
        const frame = current as Pending;
        retire(frame);
        frame.parent.unresolved = true;
        current = frame.parent;
      }
      const node = target.node;
      node.raw.close = raw;
      node.children = finishChildren(target.children, target.unresolved);
      // 活跃 frame 总是父节点的最后一个子段。
      target.parent.children[target.parent.children.length - 1] = node;
      retire(target);
      current = target.parent;
      continue;
    }
    try {
      const parsed = parseTag(header);
      if (!parsed?.name || /[\s[\]/]/.test(parsed.name)) {
        addText(raw);
        continue;
      }
      const name = parsed.name.toLowerCase();
      const spec = options.resolveTag?.(name);
      if (!spec) {
        addText(raw);
        continue;
      }
      const node: UbbTagNode = {
        type: "tag",
        tag: name,
        family: spec.family,
        attrs: parsed.attrs,
        raw: { open: raw, close: null },
        children: [],
      };
      if (spec.mode === "text" || spec.mode === "empty") {
        const end =
          spec.mode === "text" ? scanner.findEnd(name, cursor) : scanner.adjacentEnd(name, cursor);
        if (!end && spec.mode === "text") {
          addText(raw);
          continue;
        }
        if (end) {
          if (spec.mode === "text" && end.start > cursor)
            node.children.push({ type: "text", value: source.slice(cursor, end.start) });
          node.raw.close = source.slice(end.start, end.end);
          current.children.push(node);
          cursor = end.end;
        } else current.children.push(node);
      } else {
        const frame: Pending = {
          pending: true,
          node,
          mode: spec.mode,
          parent: current,
          previous: active?.get(name),
          // 内部数组交付前可能含 Pending；闭合或 EOF 时保证仅剩公开节点。
          children: node.children,
          unresolved: false,
        };
        current.children.push(frame);
        active?.set(name, frame);
        current = frame;
      }
    } catch {
      addText(raw);
    }
  }
  const result = finishChildren(root.children, root.unresolved || current !== root);
  if (options.mergeAdjacentText) mergeText(result);
  return result;
}
