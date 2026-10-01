import { createPinia, disposePinia } from "pinia";
import { createRenderer, h, nextTick, reactive } from "vue";
import { describe, expect, test } from "vite-plus/test";
import ContentRenderer from "../../src/components/rich-content/ContentRenderer.vue";
import type { ContentRendererProps } from "../../src/components/rich-content/types.ts";

interface HostNode {
  type: string;
  text: string;
  children: HostNode[];
  parent: HostNode | null;
  props: Record<string, unknown>;
}

const node = (type: string, text = ""): HostNode => ({
  type,
  text,
  children: [],
  parent: null,
  props: {},
});

// 无 DOM 依赖的 Vue 宿主，挂载真实组件并观察文本、标签和属性更新。
const renderer = createRenderer<HostNode, HostNode>({
  createElement: (type) => node(type),
  createText: (text) => node("#text", text),
  createComment: (text) => node("#comment", text),
  setText: (target, text) => {
    target.text = text;
  },
  setElementText: (target, text) => {
    for (const child of target.children) child.parent = null;
    target.children = [];
    target.text = text;
  },
  parentNode: (target) => target.parent,
  nextSibling: (target) => {
    const siblings = target.parent?.children;
    return siblings?.[siblings.indexOf(target) + 1] ?? null;
  },
  insert: (target, parent, anchor) => {
    if (target.parent) target.parent.children.splice(target.parent.children.indexOf(target), 1);
    const index = anchor ? parent.children.indexOf(anchor) : parent.children.length;
    parent.children.splice(index, 0, target);
    target.parent = parent;
  },
  remove: (target) => {
    if (target.parent) target.parent.children.splice(target.parent.children.indexOf(target), 1);
    target.parent = null;
  },
  patchProp: (target, key, _previous, value) => {
    target.props[key] = value;
  },
});

const textContent = (target: HostNode): string =>
  target.type === "#comment" ? "" : target.text + target.children.map(textContent).join("");
const elements = (target: HostNode, type: string): HostNode[] => [
  ...(target.type === type ? [target] : []),
  ...target.children.flatMap((child) => elements(child, type)),
];
const deepSource = (label: string): string =>
  `前İ😀\n${"[b]".repeat(129)}${label}<>&${"[/b]".repeat(129)}\n尾`;

function mountContent(initial: ContentRendererProps) {
  const props = reactive(initial);
  const root = node("root");
  const app = renderer.createApp({ render: () => h(ContentRenderer, props) });
  const pinia = createPinia();
  app.use(pinia);
  app.mount(root);
  return {
    props,
    root,
    unmount: () => {
      app.unmount();
      disposePinia(pinia);
    },
  };
}

describe("ContentRenderer 深度降级（客户端挂载）", () => {
  test("超过 128 层显示完整原文，不留下部分 strong 输出，原文更新仍完整", async () => {
    const source = deepSource("正文");
    const mounted = mountContent({ content: source, type: "ubb" });
    try {
      expect(textContent(mounted.root)).toBe(source);
      expect(elements(mounted.root, "strong")).toHaveLength(0);
      expect(elements(mounted.root, "div")[0]?.props.class).toContain("rich-content--ubb");
      mounted.props.content = deepSource("更新");
      await nextTick();
      expect(textContent(mounted.root)).toBe(mounted.props.content);
      expect(elements(mounted.root, "strong")).toHaveLength(0);
    } finally {
      mounted.unmount();
    }
  });

  test("普通内容、选项及内容类型更新正常，深度降级后可恢复普通渲染", async () => {
    const mounted = mountContent({
      content: "前[b]正常[/b][em01]尾",
      type: "ubb",
      options: { allowEmotion: false },
    });
    try {
      expect(textContent(mounted.root)).toBe("前正常[em01]尾");
      expect(elements(mounted.root, "strong").map(textContent)).toEqual(["正常"]);
      expect(elements(mounted.root, "img")).toHaveLength(0);
      mounted.props.options = { allowEmotion: true };
      await nextTick();
      expect(elements(mounted.root, "img")).toHaveLength(1);
      expect(textContent(mounted.root)).toBe("前正常尾");
      mounted.props.content = deepSource("降级");
      await nextTick();
      expect(textContent(mounted.root)).toBe(mounted.props.content);
      expect(elements(mounted.root, "strong")).toHaveLength(0);
      mounted.props.content = "[b]恢复[/b]尾";
      await nextTick();
      expect(textContent(mounted.root)).toBe("恢复尾");
      expect(elements(mounted.root, "strong").map(textContent)).toEqual(["恢复"]);
      mounted.props.type = "markdown";
      mounted.props.content = "**切换**";
      await nextTick();
      expect(elements(mounted.root, "strong").map(textContent)).toEqual(["切换"]);
      expect(elements(mounted.root, "div")[0]?.props.class).toContain("rich-content--markdown");
    } finally {
      mounted.unmount();
    }
  });
});
