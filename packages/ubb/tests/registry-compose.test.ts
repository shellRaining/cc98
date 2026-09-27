import { describe, expect, test } from "vite-plus/test";
import { cc98Registry, parseCc98Tag } from "../cc98/index.ts";
import { createUbbRegistry, parseUbbTag } from "../src/index.ts";
import { familyTag, tag, tagBoth, tagPos, txt, withoutRaw } from "./helpers.ts";

describe("组合 CC98 规则", () => {
  test("自定义标签集可以复用 CC98 标签头语法", () => {
    const registry = createUbbRegistry({ tags: { spoiler: "recursive" }, parseTag: parseCc98Tag });

    expect(withoutRaw(registry.parse("[spoiler='a,b',title=提示]x[/spoiler][b]y[/b]"))).toEqual([
      tagBoth("spoiler", ["a,b"], { title: "提示" }, [txt("x")]),
      txt("[b]"),
      txt("y"),
      txt("[/b]"),
    ]);
  });

  test("unregister 后可以换一种模式重新注册，原注册器不受影响", () => {
    const registry = cc98Registry.unregister("MD").register("md", "recursive");
    const source = "[md][b]粗[/b][/md]";

    expect(withoutRaw(registry.parse(source))).toEqual([tag("md", [tag("b", [txt("粗")])])]);
    expect(withoutRaw(cc98Registry.parse(source))).toEqual([tag("md", [txt("[b]粗[/b]")])]);
  });

  test("unregister 也能移除标签族", () => {
    expect(withoutRaw(cc98Registry.unregister("ac").parse("[ac01][em01]"))).toEqual([
      txt("[ac01]"),
      familyTag("em01", "em"),
    ]);
  });

  test("unregister 未注册的名称时抛错", () => {
    expect(() => cc98Registry.unregister("missing")).toThrow("未注册");
  });

  test("configure 只替换传入的配置，标签登记保持不变", () => {
    const registry = cc98Registry.configure({ parseTag: parseUbbTag });

    expect(withoutRaw(registry.parse("[color=red,title=x]字[/color]"))).toEqual([
      tagPos("color", ["red,title=x"], [txt("字")]),
    ]);
    expect(withoutRaw(cc98Registry.parse("[color=red,title=x]字[/color]"))).toEqual([
      tagBoth("color", ["red"], { title: "x" }, [txt("字")]),
    ]);
  });

  test("移除的名称不再要求 handler", () => {
    const renderer = createUbbRegistry({ tags: { keep: "empty", drop: "empty" } })
      .unregister("drop")
      .createRenderer<string>({
        renderText: (value) => value,
        concat: (parts) => parts.join(""),
        handlers: { keep: () => "✓" },
      });

    expect(renderer.render("[keep][drop]")).toBe("✓[drop]");
  });
});
