import { describe, expect, test } from "vite-plus/test";
import { createUbbRegistry, type UbbNode } from "../src/index.ts";
import { withoutRaw } from "./helpers.ts";

const textToString = (value: string): string => value;
const joinStrings = (outputs: readonly string[]): string => outputs.join("");

describe("UBB 注册表渲染器", () => {
  test("recursive 标签可读取属性、纯文本和递归渲染后的 content", () => {
    const renderer = createUbbRegistry({
      parseTag: (source) => {
        const [tag, ...params] = source.split(",");
        const [name, value] = tag.split("=");
        return {
          name,
          attrs: {
            positionals: value === undefined ? [] : [value],
            named: Object.fromEntries(params.map((param) => param.split("="))),
          },
        };
      },
    })
      .register("panel", "recursive")
      .createRenderer<string>({
        renderText: textToString,
        concat: joinStrings,
        handlers: {
          panel: ({ attrs, content, textContent }) => {
            const label = attrs.named.title || attrs.positionals[0] || "panel";
            return `<${label} data-text="${textContent}">${content}</${label}>`;
          },
        },
      });

    expect(renderer.render("[panel=info,title=提示]外层[panel]内层[/panel][/panel]")).toBe(
      '<提示 data-text="外层内层">外层<panel data-text="内层">内层</panel></提示>',
    );
  });

  test("text 标签把内部 UBB 保留为纯文本", () => {
    const renderer = createUbbRegistry()
      .register("literal", "text")
      .createRenderer<string>({
        renderText: textToString,
        concat: joinStrings,
        handlers: {
          literal: ({ textContent }) => `{${textContent}}`,
        },
      });

    expect(renderer.render("[literal][b]不递归[/b][/literal]")).toBe("{[b]不递归[/b]}");
  });

  test("empty 标签不消费后续正文，并忽略紧邻的同名结束标签", () => {
    const renderer = createUbbRegistry()
      .register("break", "empty")
      .createRenderer<string>({
        renderText: textToString,
        concat: joinStrings,
        handlers: {
          break: ({ node }) => `<${node.tag}>`,
        },
      });

    expect(renderer.render("甲[break]乙[break][/break]丙")).toBe("甲<break>乙<break>丙");
  });

  test("autoclose 标签同时支持无结束标签和包裹内容", () => {
    const renderer = createUbbRegistry()
      .register("mention", "autoclose")
      .createRenderer<string>({
        renderText: textToString,
        concat: joinStrings,
        handlers: {
          mention: ({ attrs, textContent }) => `@${attrs.positionals[0] ?? textContent}`,
        },
      });

    expect(renderer.render("[mention=alice] 后文；[mention]Bob[/mention]")).toBe(
      "@alice 后文；@Bob",
    );
  });

  test("content 是按需计算且只计算一次的 getter", () => {
    let textRenderCount = 0;
    const renderer = createUbbRegistry()
      .register("drop", "recursive")
      .register("repeat", "recursive")
      .createRenderer<string>({
        renderText: (value) => {
          textRenderCount += 1;
          return value;
        },
        concat: joinStrings,
        handlers: {
          drop: ({ textContent }) => `[已省略 ${textContent.length} 字]`,
          repeat: (input) => `${input.content}|${input.content}`,
        },
      });

    expect(renderer.render("[drop]hidden[/drop][repeat]shown[/repeat]")).toBe(
      "[已省略 6 字]shown|shown",
    );
    expect(textRenderCount).toBe(1);
  });

  test("renderNodes 支持字符串以外的泛型输出", () => {
    type Segment = {
      kind: "text" | "tag";
      value: string;
    };

    const renderer = createUbbRegistry()
      .register("token", "recursive")
      .createRenderer<Segment[]>({
        renderText: (value) => [{ kind: "text", value }],
        concat: (outputs) => outputs.flatMap((output) => output),
        handlers: {
          token: ({ node, attrs, textContent }) => [
            {
              kind: "tag",
              value: `${node.tag}:${attrs.positionals[0] ?? "default"}:${textContent}`,
            },
          ],
        },
      });

    expect(renderer.render("a[token=hot]b[/token]c")).toEqual([
      { kind: "text", value: "a" },
      { kind: "tag", value: "token:hot:b" },
      { kind: "text", value: "c" },
    ]);

    const nodes: UbbNode[] = [
      { type: "text", value: "甲" },
      {
        type: "tag",
        tag: "token",
        attrs: { positionals: ["manual"], named: {} },
        raw: { open: "[token=manual]", close: "[/token]" },
        children: [{ type: "text", value: "乙" }],
      },
    ];
    expect(renderer.renderNodes(nodes)).toEqual([
      { kind: "text", value: "甲" },
      { kind: "tag", value: "token:manual:乙" },
    ]);
  });

  test("Context 会传给文本、拼接、handler 和 finalize，内部 renderNodes 不重复 finalize", () => {
    interface RenderContext {
      prefix: string;
      separator: string;
      repeat: number;
      finalizeCount: number;
    }

    const renderer = createUbbRegistry()
      .register("repeat", "recursive")
      .createRenderer<string, RenderContext>({
        renderText: (value, context) => `${context.prefix}${value}`,
        concat: (outputs, context) => outputs.join(context.separator),
        handlers: {
          repeat: ({ node, context, renderNodes }) =>
            Array.from({ length: context.repeat }, () => renderNodes(node.children)).join("+"),
        },
        finalize: (output, context) => {
          context.finalizeCount += 1;
          return `{${output}}`;
        },
      });
    const context: RenderContext = {
      prefix: "~",
      separator: "/",
      repeat: 2,
      finalizeCount: 0,
    };

    expect(renderer.render("[repeat]x[/repeat]z", context)).toBe("{~x+~x/~z}");
    expect(context.finalizeCount).toBe(1);
  });

  test("fallback 只处理已注册但没有专用 handler 的标签", () => {
    let fallbackCount = 0;
    const renderer = createUbbRegistry()
      .register("handled", "recursive")
      .register("unhandled", "recursive")
      .createRenderer<string>({
        renderText: textToString,
        concat: joinStrings,
        handlers: {
          handled: ({ content }) => `<handled>${content}</handled>`,
        },
        fallback: ({ node, attrs, content, textContent }) => {
          fallbackCount += 1;
          return `<${node.tag} value="${attrs.positionals[0] ?? ""}" text="${textContent}">${content}</${node.tag}>`;
        },
      });

    expect(renderer.render("[handled]甲[/handled][unhandled=x]乙[/unhandled]")).toBe(
      '<handled>甲</handled><unhandled value="x" text="乙">乙</unhandled>',
    );
    expect(fallbackCount).toBe(1);

    expect(renderer.render("[missing]未知[/missing]")).toBe("[missing]未知[/missing]");
    expect(fallbackCount).toBe(1);
  });

  test("不同 registry 的标签定义和 renderer 互不影响", () => {
    const leftRenderer = createUbbRegistry()
      .register("leftonly", "recursive")
      .createRenderer<string>({
        renderText: textToString,
        concat: joinStrings,
        handlers: {
          leftonly: ({ content }) => `<left>${content}</left>`,
        },
      });
    const rightRenderer = createUbbRegistry()
      .register("rightonly", "recursive")
      .createRenderer<string>({
        renderText: textToString,
        concat: joinStrings,
        handlers: {
          rightonly: ({ content }) => `<right>${content}</right>`,
        },
      });

    expect(leftRenderer.render("[leftonly]甲[/leftonly]")).toBe("<left>甲</left>");
    expect(rightRenderer.render("[leftonly]甲[/leftonly]")).toBe("[leftonly]甲[/leftonly]");
    expect(rightRenderer.render("[rightonly]乙[/rightonly]")).toBe("<right>乙</right>");
    expect(leftRenderer.render("[rightonly]乙[/rightonly]")).toBe("[rightonly]乙[/rightonly]");
  });

  test("未注册标签保持原始文本，不吞掉属性、正文或结束标签", () => {
    const renderer = createUbbRegistry().createRenderer<string>({
      renderText: textToString,
      concat: joinStrings,
      handlers: {},
    });

    expect(renderer.render("前[missing=1,title=标题]正文[/missing]后")).toBe(
      "前[missing=1,title=标题]正文[/missing]后",
    );
  });

  test("默认参数只拆首个等号，CC98 专属标签不被识别", () => {
    const registry = createUbbRegistry().register("link", "recursive");
    expect(
      withoutRaw(registry.parse("[link=https://example.org/?a=1,b=2]内容[/link][em01]")),
    ).toEqual([
      {
        type: "tag",
        tag: "link",
        attrs: { positionals: ["https://example.org/?a=1,b=2"], named: {} },
        children: [{ type: "text", value: "内容" }],
      },
      { type: "text", value: "[em01]" },
    ]);
  });

  test("自定义标签头解析失败时按原文保留，其他标签仍可解析", () => {
    const registry = createUbbRegistry({
      tags: { item: "empty" },
      parseTag: (source) => {
        if (!source.startsWith("item:")) return null;
        const value = source.slice("item:".length);
        if (!value) throw new Error("缺少编号");
        return { name: "item", attrs: { positionals: [value], named: {} } };
      },
    });
    expect(withoutRaw(registry.parse("[item:42][item:][item=3]"))).toEqual([
      { type: "tag", tag: "item", attrs: { positionals: ["42"], named: {} }, children: [] },
      { type: "text", value: "[item:]" },
      { type: "text", value: "[item=3]" },
    ]);
  });
});

describe("UBB 标签族", () => {
  const registry = createUbbRegistry({
    tags: { star: "empty" },
    families: { icon: { pattern: /^(?:star|icon)\d+$/, mode: "empty" } },
  })
    .registerFamily("digits", /^\d+$/, "empty")
    .registerFamily("wide", /^(?:icon\d+|\d+)$/, "empty");

  test("精确标签优先，其余按登记顺序匹配第一个标签族", () => {
    expect(withoutRaw(registry.parse("[star][ICON1][42]"))).toEqual([
      { type: "tag", tag: "star", attrs: { positionals: [], named: {} }, children: [] },
      {
        type: "tag",
        tag: "icon1",
        family: "icon",
        attrs: { positionals: [], named: {} },
        children: [],
      },
      {
        type: "tag",
        tag: "42",
        family: "digits",
        attrs: { positionals: [], named: {} },
        children: [],
      },
    ]);
  });

  test("handler 按族名登记，收到具体标签名", () => {
    const renderer = registry.createRenderer<string>({
      renderText: textToString,
      concat: joinStrings,
      handlers: {
        star: () => "★",
        icon: ({ node }) => `<${node.family}:${node.tag}>`,
        digits: ({ node }) => `#${node.tag}`,
        wide: () => "不会命中",
      },
    });

    expect(renderer.render("[star][icon7][star2][3]")).toBe("★<icon:icon7><icon:star2>#3");
  });

  test("没有 fallback 时类型要求覆盖全部标签族", () => {
    // @ts-expect-error 缺少 wide 族的 handler
    const renderer = registry.createRenderer<string>({
      renderText: textToString,
      concat: joinStrings,
      handlers: { star: () => "", icon: () => "", digits: () => "" },
    });
    expect(renderer.render("[icon1]")).toBe("");
  });

  test("标签和标签族共用名称空间", () => {
    expect(() => registry.register("ICON", "empty")).toThrow("已注册");
    expect(() => registry.registerFamily("star", /^x$/, "empty")).toThrow("已注册");
  });

  test("拒绝依赖 lastIndex 的正则标志", () => {
    expect(() => registry.registerFamily("g", /^g\d$/g, "empty")).toThrow("g 或 y");
    expect(() => registry.registerFamily("y", /^y\d$/y, "empty")).toThrow("g 或 y");
  });
});
