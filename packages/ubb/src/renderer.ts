import { getUbbTextContent } from "./node-utils.ts";
import type { UbbTagModes } from "./registry.ts";
import type { UbbAttrs, UbbNode, UbbTagNode } from "./types.ts";

type UbbContextArgs<Context> = [Context] extends [void] ? [context?: Context] : [context: Context];

export interface UbbTagHandlerProps<Output, Context, Node extends UbbTagNode = UbbTagNode> {
  readonly node: Readonly<Node>;
  readonly attrs: Readonly<UbbAttrs>;
  /** 子节点经当前 renderer 转换并合并后的结果，首次读取时才计算。 */
  readonly content: Output;
  /** 子节点的纯文本内容，首次读取时才计算。 */
  readonly textContent: string;
  readonly context: Context;
  /** 使用当前 renderer 和 context 转换任意子树，不执行顶层 finalize。 */
  readonly renderNodes: (nodes: readonly UbbNode[]) => Output;
}

export type UbbTagHandler<Output, Context = void, Node extends UbbTagNode = UbbTagNode> = (
  props: UbbTagHandlerProps<Output, Context, Node>,
) => Output;

/** 精确标签按标签名登记，标签族按族名登记。 */
export type UbbTagHandlers<
  Tags extends UbbTagModes,
  Families extends UbbTagModes,
  Output,
  Context = void,
> = Readonly<
  {
    [Tag in Extract<keyof Tags, string>]: UbbTagHandler<Output, Context, UbbTagNode & { tag: Tag }>;
  } & {
    [Family in Extract<keyof Families, string>]: UbbTagHandler<
      Output,
      Context,
      UbbTagNode & { family: Family }
    >;
  }
>;

interface UbbRendererBaseOptions<Output, Context = void> {
  /** 单次渲染的最大标签调用深度，默认 128。 */
  readonly maxDepth?: number;
  /** 把一个 AST 文本节点转换为目标输出。 */
  readonly renderText: (value: string, context: Context) => Output;
  /** 把兄弟节点的输出合并为一个目标输出。 */
  readonly concat: (parts: readonly Output[], context: Context) => Output;
  /** 只在公开的 render/renderNodes 根输出完成后执行。 */
  readonly finalize?: (output: Output, context: Context) => Output;
}

export type UbbRendererOptions<
  Tags extends UbbTagModes,
  Families extends UbbTagModes,
  Output,
  Context = void,
> = UbbRendererBaseOptions<Output, Context> &
  (
    | {
        /** 已注册标签和标签族的输出 handler，键由 registry 泛型推导。 */
        handlers: UbbTagHandlers<Tags, Families, Output, Context>;
        /** 处理手动构造、未登记的节点；已登记名称已经由 handlers 完整覆盖。 */
        fallback?: UbbTagHandler<Output, Context>;
      }
    | {
        /** 提供 fallback 时可以只覆盖部分标签和标签族。 */
        handlers: Partial<UbbTagHandlers<Tags, Families, Output, Context>>;
        /** 处理没有专用 handler 的节点。 */
        fallback: UbbTagHandler<Output, Context>;
      }
  );

export interface UbbRenderer<Output, Context = void> {
  render(source: string, ...args: UbbContextArgs<Context>): Output;
  renderNodes(nodes: readonly UbbNode[], ...args: UbbContextArgs<Context>): Output;
}

type ParseUbb = (source: string) => UbbNode[];

export class UbbRenderDepthError extends Error {
  readonly maxDepth: number;
  constructor(maxDepth: number) {
    super(`UBB: 渲染深度超过 ${maxDepth}`);
    this.name = "UbbRenderDepthError";
    this.maxDepth = maxDepth;
  }
}

export function createUbbRenderer<
  Tags extends UbbTagModes,
  Families extends UbbTagModes,
  Output,
  Context = void,
>(
  parse: ParseUbb,
  options: UbbRendererOptions<Tags, Families, Output, Context>,
): UbbRenderer<Output, Context> {
  const renderText = options.renderText;
  const concat = options.concat;
  const fallback = options.fallback;
  const finalizeOutput = options.finalize;
  const maxDepth = options.maxDepth ?? 128;
  if (!Number.isSafeInteger(maxDepth) || maxDepth < 1)
    throw new TypeError("UBB: maxDepth 必须是正安全整数");
  const handlers = new Map(
    Object.entries(options.handlers) as [string, UbbTagHandler<Output, Context> | undefined][],
  );

  class HandlerProps implements UbbTagHandlerProps<Output, Context> {
    readonly node: UbbTagNode;
    readonly context: Context;
    private readonly depth: number;
    readonly attrs: Readonly<UbbAttrs>;
    private cachedRenderNodes: ((nodes: readonly UbbNode[]) => Output) | undefined;
    private hasContent = false;
    private cachedContent!: Output;
    private hasTextContent = false;
    private cachedTextContent = "";
    constructor(node: UbbTagNode, context: Context, depth: number) {
      this.node = node;
      this.context = context;
      this.depth = depth;
      this.attrs = node.attrs;
      this.cachedRenderNodes = undefined;
    }
    get renderNodes(): (nodes: readonly UbbNode[]) => Output {
      return (this.cachedRenderNodes ??= (nodes) => renderNodes(nodes, this.context, this.depth));
    }
    get content(): Output {
      if (!this.hasContent) {
        this.cachedContent = renderNodes(this.node.children, this.context, this.depth);
        this.hasContent = true;
      }
      return this.cachedContent;
    }
    get textContent(): string {
      if (!this.hasTextContent) {
        this.cachedTextContent = getUbbTextContent(this.node.children);
        this.hasTextContent = true;
      }
      return this.cachedTextContent;
    }
  }

  function renderNodes(nodes: readonly UbbNode[], context: Context, depth = 0): Output {
    return concat(
      nodes.map((node) => renderNode(node, context, depth)),
      context,
    );
  }

  function renderNode(node: UbbNode, context: Context, depth: number): Output {
    if (node.type === "text") return renderText(node.value, context);
    if (depth >= maxDepth) throw new UbbRenderDepthError(maxDepth);

    const handler = handlers.get(node.family ?? node.tag) ?? fallback;
    if (!handler) return renderNodes(node.children, context, depth + 1);
    return handler(new HandlerProps(node, context, depth + 1));
  }

  function finalize(output: Output, context: Context): Output {
    return finalizeOutput ? finalizeOutput(output, context) : output;
  }

  const renderer: UbbRenderer<Output, Context> = {
    render(source: string, ...args: UbbContextArgs<Context>) {
      const context = args[0] as Context;
      return finalize(renderNodes(parse(source), context), context);
    },
    renderNodes(nodes: readonly UbbNode[], ...args: UbbContextArgs<Context>) {
      const context = args[0] as Context;
      return finalize(renderNodes(nodes, context), context);
    },
  };

  return Object.freeze(renderer);
}
