import type {
  Definition,
  FootnoteDefinition,
  Nodes,
  Parent,
  Root,
  Table,
  TableCell,
  TableRow,
} from "mdast";
import { Fragment, h, type VNodeChild } from "vue";
import { sanitizeImageUrl, sanitizeLinkUrl } from "../security";
import type { RichContentOptions } from "../types";
import UniverseCodeBlock from "../universe/UniverseCodeBlock.vue";
import UniverseImage from "../universe/UniverseImage.vue";
import UniverseLink from "../universe/UniverseLink.vue";
import UniverseMath from "../universe/UniverseMath.vue";
import UniverseQuote from "../universe/UniverseQuote.vue";

interface MarkdownRenderContext {
  definitions: ReadonlyMap<string, Definition>;
  footnotes: ReadonlyMap<string, FootnoteDefinition>;
  footnoteNumbers: ReadonlyMap<string, number>;
  options: Readonly<RichContentOptions>;
}

function normalizedIdentifier(identifier: string): string {
  return identifier.trim().replace(/\s+/g, " ").toLowerCase();
}

function renderChildren(node: Parent, context: MarkdownRenderContext): VNodeChild[] {
  return node.children.map((child) => renderMarkdownNode(child as Nodes, context));
}

function renderLink(
  source: string,
  title: string | null | undefined,
  children: VNodeChild[],
  context: MarkdownRenderContext,
): VNodeChild {
  const href = sanitizeLinkUrl(source, context.options);
  return href
    ? h(UniverseLink, { href, title: title ?? undefined }, () => children)
    : h(Fragment, null, children);
}

function renderImage(
  source: string,
  alt: string | null | undefined,
  title: string | null | undefined,
  context: MarkdownRenderContext,
): VNodeChild {
  const src = sanitizeImageUrl(source, context.options);
  if (!src) return alt || source;
  return h(UniverseImage, {
    src,
    alt: alt ?? "",
    title: title ?? undefined,
    defaultVisible: true,
    allowToolbox: false,
    showCaption: Boolean(title),
  });
}

function renderTableCell(
  cell: TableCell,
  tag: "th" | "td",
  align: NonNullable<Table["align"]>[number] | undefined,
  context: MarkdownRenderContext,
): VNodeChild {
  return h(
    tag,
    {
      class: "border border-cc98-border px-3 py-2",
      style: align ? { textAlign: align } : undefined,
    },
    renderChildren(cell, context),
  );
}

function renderTableRow(
  row: TableRow,
  tag: "th" | "td",
  align: NonNullable<Table["align"]>,
  context: MarkdownRenderContext,
): VNodeChild {
  return h(
    "tr",
    row.children.map((cell, index) => renderTableCell(cell, tag, align[index], context)),
  );
}

function renderTable(table: Table, context: MarkdownRenderContext): VNodeChild {
  const [header, ...body] = table.children;
  const align = table.align ?? [];
  return h("div", { class: "rich-content-table-wrap my-3 overflow-x-auto" }, [
    h("table", { class: "w-full border-collapse text-left" }, [
      header ? h("thead", [renderTableRow(header, "th", align, context)]) : null,
      body.length
        ? h(
            "tbody",
            body.map((row) => renderTableRow(row, "td", align, context)),
          )
        : null,
    ]),
  ]);
}

function renderFootnotes(context: MarkdownRenderContext): VNodeChild | null {
  const definitions = [...context.footnoteNumbers.entries()]
    .sort((left, right) => left[1] - right[1])
    .flatMap(([identifier, number]) => {
      const definition = context.footnotes.get(identifier);
      return definition ? [h("li", { value: number }, renderChildren(definition, context))] : [];
    });

  if (definitions.length === 0) return null;
  return h("section", { class: "mt-5 border-t border-cc98-border pt-3" }, [
    h("h2", { class: "mb-2 font-bold" }, "脚注"),
    h("ol", { class: "list-decimal pl-6" }, definitions),
  ]);
}

function renderMarkdownNode(node: Nodes, context: MarkdownRenderContext): VNodeChild {
  switch (node.type) {
    case "root":
      return h(Fragment, null, [...renderChildren(node, context), renderFootnotes(context)]);
    case "text":
      return node.value;
    case "paragraph":
      return h("p", { class: "my-2" }, renderChildren(node, context));
    case "heading":
      return h(`h${node.depth}`, { class: "mb-2 mt-5 font-bold" }, renderChildren(node, context));
    case "strong":
      return h("strong", renderChildren(node, context));
    case "emphasis":
      return h("em", renderChildren(node, context));
    case "delete":
      return h("s", renderChildren(node, context));
    case "blockquote":
      return h(UniverseQuote, null, () => renderChildren(node, context));
    case "list":
      return h(
        node.ordered ? "ol" : "ul",
        {
          class: node.ordered ? "my-2 list-decimal pl-6" : "my-2 list-disc pl-6",
          start: node.ordered ? (node.start ?? undefined) : undefined,
        },
        renderChildren(node, context),
      );
    case "listItem":
      return h("li", { class: node.checked == null ? undefined : "list-none" }, [
        node.checked == null
          ? null
          : h("input", {
              type: "checkbox",
              checked: node.checked,
              disabled: true,
              class: "mr-2 align-middle",
            }),
        ...renderChildren(node, context),
      ]);
    case "thematicBreak":
      return h("hr", { class: "my-4 border-0 border-t border-cc98-border" });
    case "break":
      return h("br");
    case "inlineCode":
      return h(
        "code",
        { class: "rounded bg-cc98-surface px-1 py-0.5 font-mono text-sm" },
        node.value,
      );
    case "inlineMath":
      return h(UniverseMath, { content: node.value, inline: true });
    case "math":
      return h(UniverseMath, { content: node.value });
    case "code":
      return h(UniverseCodeBlock, {
        code: node.value,
        language: node.lang ?? undefined,
      });
    case "link":
      return renderLink(node.url, node.title, renderChildren(node, context), context);
    case "linkReference": {
      const definition = context.definitions.get(normalizedIdentifier(node.identifier));
      return definition
        ? renderLink(definition.url, definition.title, renderChildren(node, context), context)
        : node.label || renderChildren(node, context);
    }
    case "image":
      return renderImage(node.url, node.alt, node.title, context);
    case "imageReference": {
      const definition = context.definitions.get(normalizedIdentifier(node.identifier));
      return definition
        ? renderImage(definition.url, node.alt, definition.title, context)
        : node.alt || node.label || "";
    }
    case "table":
      return renderTable(node, context);
    case "footnoteReference":
      return h("sup", context.footnoteNumbers.get(normalizedIdentifier(node.identifier)) ?? "?");
    case "html":
      return node.value;
    case "definition":
    case "footnoteDefinition":
      return null;
    default:
      return "children" in node
        ? h(Fragment, null, renderChildren(node as Parent, context))
        : "value" in node
          ? String(node.value)
          : "";
  }
}

export function renderMarkdownRoot(root: Root, options: Readonly<RichContentOptions>): VNodeChild {
  const definitions = new Map<string, Definition>();
  const footnotes = new Map<string, FootnoteDefinition>();
  const footnoteNumbers = new Map<string, number>();

  for (const node of root.children) {
    if (node.type === "definition") {
      definitions.set(normalizedIdentifier(node.identifier), node);
    } else if (node.type === "footnoteDefinition") {
      footnotes.set(normalizedIdentifier(node.identifier), node);
    }
  }

  const collectFootnoteReferences = (node: Nodes) => {
    if (node.type === "footnoteReference") {
      const identifier = normalizedIdentifier(node.identifier);
      if (!footnoteNumbers.has(identifier))
        footnoteNumbers.set(identifier, footnoteNumbers.size + 1);
    }
    if ("children" in node) {
      for (const child of node.children) collectFootnoteReferences(child as Nodes);
    }
  };
  collectFootnoteReferences(root);

  return renderMarkdownNode(root, { definitions, footnotes, footnoteNumbers, options });
}
