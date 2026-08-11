import { getUbbTextContent } from "./node-utils.ts";
import type { UbbTagModes } from "./registry.ts";
import type { UbbAttrs, UbbNode, UbbTagNode } from "./types.ts";

type UbbContextArgs<Context> = [Context] extends [void] ? [context?: Context] : [context: Context];

export interface UbbTagHandlerProps<Output, Context, Tag extends string = string> {
  readonly node: Readonly<UbbTagNode> & { readonly tag: Tag };
  readonly attrs: Readonly<UbbAttrs>;
  /** 子节点经当前 renderer 转换并合并后的结果，首次读取时才计算。 */
  readonly children: Output;
  /** 子节点的纯文本内容，首次读取时才计算。 */
  readonly text: string;
  readonly context: Context;
  /** 使用当前 renderer 和 context 转换任意子树，不执行顶层 finalizer。 */
  readonly render: (nodes: readonly UbbNode[]) => Output;
}

export type UbbTagHandler<Output, Context = void, Tag extends string = string> = (
  props: UbbTagHandlerProps<Output, Context, Tag>,
) => Output;

export type UbbTagHandlers<Tags extends UbbTagModes, Output, Context = void> = Readonly<{
  [Tag in Extract<keyof Tags, string>]: UbbTagHandler<Output, Context, Tag>;
}>;

interface UbbRendererBaseOptions<Output, Context = void> {
  /** 把一个 AST 文本节点转换为目标输出。 */
  readonly text: (value: string, context: Context) => Output;
  /** 把兄弟节点的输出合并为一个目标输出。 */
  readonly concat: (parts: readonly Output[], context: Context) => Output;
  /** 只在公开的 render/renderNodes 根输出完成后执行。 */
  readonly finalize?: (output: Output, context: Context) => Output;
}

export type UbbRendererOptions<
  Tags extends UbbTagModes,
  Output,
  Context = void,
> = UbbRendererBaseOptions<Output, Context> &
  (
    | {
        /** 已注册精确标签的输出 handler，键由 registry 泛型推导。 */
        handlers: UbbTagHandlers<Tags, Output, Context>;
        /** 处理动态标签；精确标签已经由 handlers 完整覆盖。 */
        fallback?: UbbTagHandler<Output, Context>;
      }
    | {
        /** 提供 fallback 时可以只覆盖部分精确标签。 */
        handlers: Partial<UbbTagHandlers<Tags, Output, Context>>;
        /** 处理没有专用 handler 的精确标签和动态标签。 */
        fallback: UbbTagHandler<Output, Context>;
      }
  );

export interface UbbRenderer<Output, Context = void> {
  render(source: string, ...args: UbbContextArgs<Context>): Output;
  renderNodes(nodes: readonly UbbNode[], ...args: UbbContextArgs<Context>): Output;
}

type ParseUbb = (source: string) => UbbNode[];

export function createUbbRenderer<Tags extends UbbTagModes, Output, Context = void>(
  parse: ParseUbb,
  options: UbbRendererOptions<Tags, Output, Context>,
): UbbRenderer<Output, Context> {
  const renderText = options.text;
  const concat = options.concat;
  const fallback = options.fallback;
  const finalizeOutput = options.finalize;
  const handlers = Object.freeze({ ...options.handlers }) as unknown as Readonly<
    Record<string, UbbTagHandler<Output, Context>>
  >;

  function renderNodes(nodes: readonly UbbNode[], context: Context): Output {
    return concat(
      nodes.map((node) => renderNode(node, context)),
      context,
    );
  }

  function renderNode(node: UbbNode, context: Context): Output {
    if (node.type === "text") return renderText(node.value, context);

    const handler = handlers[node.tag] ?? fallback;
    if (!handler) return renderNodes(node.children, context);

    let hasRenderedChildren = false;
    let renderedChildren: Output;
    let hasTextContent = false;
    let textContent = "";

    const props: UbbTagHandlerProps<Output, Context> = {
      node,
      attrs: node.attrs,
      context,
      render: (nodes) => renderNodes(nodes, context),
      get children() {
        if (!hasRenderedChildren) {
          renderedChildren = renderNodes(node.children, context);
          hasRenderedChildren = true;
        }
        return renderedChildren;
      },
      get text() {
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
