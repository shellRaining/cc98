import { describe, expect, test } from "vite-plus/test";
import {
  createUbbRegistry,
  getUbbTextContent,
  UbbRenderDepthError,
  type UbbNode,
  type UbbRenderer,
  type UbbTagHandlerProps,
} from "../src/index.ts";

const text = (value: string): UbbNode => ({ type: "text", value });
const wrap = (children: UbbNode[], tag = "box"): UbbNode => ({
  type: "tag",
  tag,
  attrs: { positionals: [], named: {} },
  raw: { open: `[${tag}]`, close: `[/${tag}]` },
  children,
});
const nested = (depth: number): UbbNode[] => {
  let nodes = [text("叶")];
  for (let i = 0; i < depth; i++) nodes = [wrap(nodes)];
  return nodes;
};
const registry = createUbbRegistry().register("box", "recursive");
const concat = (parts: readonly string[]): string => parts.join("");

describe("渲染重构：深度契约", () => {
  test("默认允许 128 层，第 129 层抛公开深度错误", () => {
    const renderer = registry.createRenderer<string>({
      renderText: (value) => value,
      concat,
      handlers: { box: ({ content }) => content },
    });
    expect(renderer.renderNodes(nested(128))).toBe("叶");
    expect(() => renderer.renderNodes(nested(129))).toThrow(UbbRenderDepthError);
    expect(() => renderer.renderNodes(nested(129))).toThrow(
      expect.objectContaining({ maxDepth: 128 }),
    );
  });

  test("自定义预算对 render、解构 renderNodes 和 handler 内 renderNodes 一致", () => {
    const renderer = registry.createRenderer<string>({
      maxDepth: 2,
      renderText: (value) => value,
      concat,
      handlers: { box: ({ node, renderNodes }) => renderNodes(node.children) },
    });
    // oxlint-disable-next-line typescript/unbound-method -- 公开接口契约要求解构后调用，刻意验证不依赖 this。
    const { renderNodes } = renderer;
    expect(renderNodes(nested(2))).toBe("叶");
    expect(renderer.render("[box][box]叶[/box][/box]")).toBe("叶");
    for (const run of [
      () => renderNodes(nested(3)),
      () => renderer.render("[box][box][box]叶[/box][/box][/box]"),
    ]) {
      expect(run).toThrow(UbbRenderDepthError);
      expect(run).toThrow(expect.objectContaining({ maxDepth: 2 }));
    }
    expect(renderNodes(nested(1))).toBe("叶");
  });

  test.each([0, -1, 1.5, NaN, Infinity, -Infinity])("创建时拒绝非法 maxDepth=%s", (maxDepth) => {
    expect(() =>
      registry.createRenderer<string>({
        maxDepth,
        renderText: (value) => value,
        concat,
        handlers: { box: ({ content }) => content },
      }),
    ).toThrow();
  });

  test("预算按嵌套而非兄弟累计，默认透传和 fallback 也受限", () => {
    const transparent = createUbbRegistry().createRenderer<string>({
      maxDepth: 1,
      renderText: (value) => value,
      concat,
      handlers: {},
    });
    expect(transparent.renderNodes([wrap([text("甲")]), wrap([text("乙")])])).toBe("甲乙");
    expect(() => transparent.renderNodes(nested(2))).toThrow(UbbRenderDepthError);
    const fallback = createUbbRegistry().createRenderer<string>({
      maxDepth: 1,
      renderText: (value) => value,
      concat,
      handlers: {},
      fallback: ({ content }) => content,
    });
    expect(() => fallback.renderNodes(nested(2))).toThrow(UbbRenderDepthError);
  });

  test("不读取 content 的 handler 不遍历深层子树，textContent 可提取 20000 层", () => {
    const deep = nested(20000);
    expect(getUbbTextContent([text("前"), ...deep, wrap([]), text("尾")])).toBe("前叶尾");
    const renderer = registry.createRenderer<string>({
      maxDepth: 1,
      renderText: () => {
        throw new Error("不应渲染子文本");
      },
      concat,
      handlers: { box: ({ textContent }) => textContent },
    });
    expect(renderer.renderNodes(deep)).toBe("叶");
  });
});

describe("渲染重构：惰性状态与调用顺序", () => {
  test("保留的 props 各自惰性缓存，重复读取不重算，null 输出同样缓存", () => {
    const retained: UbbTagHandlerProps<string | null, void>[] = [];
    let reads = 0;
    let renders = 0;
    const leaf: UbbNode = {
      type: "text",
      get value() {
        reads++;
        return "甲";
      },
    };
    const renderer = registry.createRenderer<string | null>({
      renderText: () => {
        renders++;
        return null;
      },
      concat: () => null,
      handlers: {
        box: (props) => {
          retained.push(props);
          return null;
        },
      },
    });
    renderer.renderNodes([wrap([leaf]), wrap([text("乙")])]);
    expect([reads, renders]).toEqual([0, 0]);
    expect(retained[0].textContent).toBe("甲");
    expect(retained[0].textContent).toBe("甲");
    expect(reads).toBe(1);
    expect(retained[1].textContent).toBe("乙");
    expect(retained[0].content).toBeNull();
    expect(retained[0].content).toBeNull();
    expect(renders).toBe(1);
    expect(retained[1].content).toBeNull();
    expect(renders).toBe(2);
    renderer.renderNodes([wrap([text("丙")])]);
    expect(retained[0].textContent).toBe("甲");
    expect(retained[2].textContent).toBe("丙");
  });

  test("context 副作用按惰性读取顺序发生，内部解构 renderNodes 不 finalize", () => {
    interface Context {
      events: string[];
    }
    const context: Context = { events: [] };
    const renderer = registry.createRenderer<string, Context>({
      renderText: (value, ctx) => {
        expect(ctx).toBe(context);
        ctx.events.push(`文本:${value}`);
        return value;
      },
      concat: (parts, ctx) => {
        ctx.events.push(`合并:${parts.join("")}`);
        return parts.join("");
      },
      handlers: {
        box: (props) => {
          expect(props.context).toBe(context);
          context.events.push("进入");
          expect(props.textContent).toBe("甲");
          context.events.push("纯文本后");
          const first = props.content;
          expect(props.content).toBe(first);
          context.events.push("缓存后");
          const { renderNodes } = props;
          const second = renderNodes([text("乙")]);
          context.events.push("退出");
          return first + second;
        },
      },
      finalize: (output, ctx) => {
        ctx.events.push(`完成:${output}`);
        return `{${output}}`;
      },
    });
    // oxlint-disable-next-line typescript/unbound-method -- 保留解构调用，验证公开接口仍传递 context 并执行一次 finalize。
    const { renderNodes } = renderer;
    expect(renderNodes([wrap([text("甲")]), text("尾")], context)).toBe("{甲乙尾}");
    expect(context.events).toEqual([
      "进入",
      "纯文本后",
      "文本:甲",
      "合并:甲",
      "缓存后",
      "文本:乙",
      "合并:乙",
      "退出",
      "文本:尾",
      "合并:甲乙尾",
      "完成:甲乙尾",
    ]);
  });

  test("同一 renderer 重入使用独立深度和 context，外层 props 不被替换", () => {
    interface Context {
      name: string;
      events: string[];
    }
    const events: string[] = [];
    let renderer: UbbRenderer<string, Context>;
    renderer = registry.createRenderer<string, Context>({
      maxDepth: 1,
      renderText: (value, context) => {
        events.push(`${context.name}:文本`);
        return value;
      },
      concat,
      handlers: {
        box: (props) => {
          events.push(`${props.context.name}:进入`);
          if (props.context.name === "外") {
            expect(renderer.renderNodes(nested(1), { name: "内", events })).toBe("内:叶");
            expect(props.context.name).toBe("外");
          }
          const output = props.content;
          events.push(`${props.context.name}:退出`);
          return output;
        },
      },
      finalize: (output, context) => {
        events.push(`${context.name}:完成`);
        return `${context.name}:${output}`;
      },
    });
    expect(renderer.renderNodes(nested(1), { name: "外", events })).toBe("外:叶");
    expect(events).toEqual([
      "外:进入",
      "内:进入",
      "内:文本",
      "内:退出",
      "内:完成",
      "外:文本",
      "外:退出",
      "外:完成",
    ]);
  });

  test("content 计算异常原样传播，失败不缓存且可在同一 props 上重试", () => {
    const error = new Error("首次失败");
    let calls = 0;
    const renderer = registry.createRenderer<string>({
      maxDepth: 1,
      renderText: (value) => {
        if (++calls === 1) throw error;
        return value;
      },
      concat,
      handlers: {
        box: (props) => {
          expect(() => props.content).toThrow(error);
          const output = props.content;
          expect(props.content).toBe(output);
          return output;
        },
      },
    });
    expect(renderer.renderNodes(nested(1))).toBe("叶");
    expect(calls).toBe(2);
  });

  test.each(["文本", "handler", "合并", "finalize"])("%s 异常后下一次调用状态恢复", (stage) => {
    const error = new Error(stage);
    let fail = true;
    let finalized = 0;
    const maybeThrow = (current: string) => {
      if (fail && stage === current) throw error;
    };
    const renderer = registry.createRenderer<string>({
      maxDepth: 1,
      renderText: (value) => {
        maybeThrow("文本");
        return value;
      },
      concat: (parts) => {
        maybeThrow("合并");
        return parts.join("");
      },
      handlers: {
        box: (props) => {
          maybeThrow("handler");
          return props.content;
        },
      },
      finalize: (output) => {
        finalized++;
        maybeThrow("finalize");
        return output;
      },
    });
    let caught: unknown;
    try {
      renderer.renderNodes(nested(1));
    } catch (cause) {
      caught = cause;
    }
    expect(caught).toBe(error);
    expect(finalized).toBe(stage === "finalize" ? 1 : 0);
    fail = false;
    expect(renderer.renderNodes(nested(1))).toBe("叶");
    expect(finalized).toBe(stage === "finalize" ? 2 : 1);
  });
});
