import { expect, test } from "vite-plus/test";
import { ubbToMarkdown, createUbbEngine, defaultUbbOptions } from "../src/index.ts";

test("createUbbEngine returns default options", () => {
  const engine = createUbbEngine();
  expect(engine.options).toEqual(defaultUbbOptions);
});

test("createUbbEngine merges overrides", () => {
  const engine = createUbbEngine({ allowImage: false });
  expect(engine.options.allowImage).toBe(false);
  expect(engine.options.allowExternalUrl).toBe(true);
});

test("ubbToMarkdown converts [b] to **", () => {
  expect(ubbToMarkdown("[b]bold[/b]")).toBe("**bold**");
});

test("ubbToMarkdown converts [i] to _", () => {
  expect(ubbToMarkdown("[i]italic[/i]")).toBe("_italic_");
});

test("ubbToMarkdown converts [del] to ~~", () => {
  expect(ubbToMarkdown("[del]struck[/del]")).toBe("~~struck~~");
});

test("ubbToMarkdown strips [color]", () => {
  expect(ubbToMarkdown("[color=red]text[/color]")).toBe("text");
});

test("ubbToMarkdown converts [img] to ![]()", () => {
  expect(ubbToMarkdown("[img]http://a.com/x.png[/img]")).toBe("![](http://a.com/x.png)");
});

test("ubbToMarkdown converts [url=...] to [text](url)", () => {
  expect(ubbToMarkdown("[url=/topic/1]link[/url]")).toBe("[link](/topic/1)");
});

test("ubbToMarkdown strips [acNN] emoji tags", () => {
  expect(ubbToMarkdown("hello[ac01]")).toBe("hello");
});

test("ubbToMarkdown handles empty input", () => {
  expect(ubbToMarkdown("")).toBe("");
});
