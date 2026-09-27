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
  const handlers = new Map(
    Object.entries(options.handlers) as [string, UbbTagHandler<Output, Context> | undefined][],
  );

  function renderNodes(nodes: readonly UbbNode[], context: Context): Output {
    return concat(
      nodes.map((node) => renderNode(node, context)),
      context,
    );
  }

  function renderNode(node: UbbNode, context: Context): Output {
    if (node.type === "text") return renderText(node.value, context);

    const handler = handlers.get(node.family ?? node.tag) ?? fallback;
    if (!handler) return renderNodes(node.children, context);

    let hasContent = false;
    let content: Output;
    let hasTextContent = false;
    let textContent = "";

    const props: UbbTagHandlerProps<Output, Context> = {
      node,
      attrs: node.attrs,
      context,
      renderNodes: (nodes) => renderNodes(nodes, context),
      get content() {
        if (!hasContent) {
          content = renderNodes(node.children, context);
          hasContent = true;
        }
        return content;
      },
      get textContent() {
        if (!hasTextContent) {
          textContent = getUbbTextContent(node.children);
          hasTextContent = true;
        }
        return textContent;
      },
    };

    return handler(props);
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
