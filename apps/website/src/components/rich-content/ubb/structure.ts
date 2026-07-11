import type { UbbNode, UbbTagNode } from "@cc98/ubb";
import { h } from "vue";
import UniverseQuote from "../universe/UniverseQuote.vue";
import type { UbbTagRenderer } from "./types";

type QuoteTagNode = UbbTagNode & { tag: "quote" | "quotex" };

function isQuoteNode(node: UbbNode): node is QuoteTagNode {
  return node.type === "tag" && (node.tag === "quote" || node.tag === "quotex");
}

function stripQuoteDescendants(nodes: UbbNode[]): {
  nodes: UbbNode[];
  layers: UbbTagNode[];
} {
  const normalizedNodes: UbbNode[] = [];
  const layers: UbbTagNode[] = [];

  for (const node of nodes) {
    if (isQuoteNode(node)) {
      layers.push(...flattenQuoteChain(node));
      continue;
    }
    if (node.type === "text") {
      normalizedNodes.push(node);
      continue;
    }

    const normalized = stripQuoteDescendants(node.children);
    layers.push(...normalized.layers);
    normalizedNodes.push({ ...node, children: normalized.nodes });
  }

  return { nodes: normalizedNodes, layers };
}

function flattenQuoteChain(root: UbbTagNode): UbbTagNode[] {
  const normalized = stripQuoteDescendants(root.children);
  return [...normalized.layers, { ...root, children: normalized.nodes }];
}

export const renderQuoteTag: UbbTagRenderer = (node, context, renderChildren) => {
  const layers = flattenQuoteChain(node);
  const quotes = layers.map((layer) =>
    h(UniverseQuote, { source: layer.attrs.positionals[0] || undefined }, () =>
      renderChildren(layer, context),
    ),
  );
  return quotes.length === 1
    ? quotes[0]
    : h("div", { class: "my-3 max-h-[50rem] overflow-y-auto" }, quotes);
};

export const renderDividerTag: UbbTagRenderer = () =>
  h("hr", { class: "my-4 border-0 border-t border-cc98-border" });

function positiveSpan(value: string | undefined): number | undefined {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : undefined;
}

export const renderTableTag: UbbTagRenderer = (node, context, renderChildren) => {
  const children = renderChildren(node, context);
  if (node.tag === "table") {
    return h("div", { class: "my-3 overflow-x-auto" }, [
      h("table", { class: "w-full border-collapse text-left" }, children),
    ]);
  }
  if (node.tag === "tr") return h("tr", children);

  const tag = node.tag === "th" ? "th" : "td";
  const rowspan = positiveSpan(node.attrs.positionals[0]);
  const colspan = positiveSpan(node.attrs.positionals[1]);
  return h(
    tag,
    {
      rowspan,
      colspan,
      class: "border border-cc98-border px-3 py-2 align-top",
    },
    children,
  );
};
