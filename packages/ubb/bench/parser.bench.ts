// oxlint-disable-next-line vite-plus/prefer-vite-plus-imports -- vite-plus/test 当前无法运行 bench 回调
import { bench, describe } from "vitest";
import { parseUbb, ubbToHtml, ubbToMarkdown } from "../src/index.ts";
import {
  createDenseTagSample,
  createMixedSample,
  createPlainTextSample,
  formatUtf8Size,
} from "./samples.ts";

const plainText = createPlainTextSample(200);
const mixedSmall = createMixedSample(10);
const mixedMedium = createMixedSample(100);
const denseTags = createDenseTagSample(1000);

describe("parseUbb", () => {
  bench(`纯文本 ${formatUtf8Size(plainText)}`, () => {
    parseUbb(plainText);
  });
  bench(`混合标签 ${formatUtf8Size(mixedSmall)}`, () => {
    parseUbb(mixedSmall);
  });
  bench(`混合标签 ${formatUtf8Size(mixedMedium)}`, () => {
    parseUbb(mixedMedium);
  });
  bench(`高节点密度 ${formatUtf8Size(denseTags)}`, () => {
    parseUbb(denseTags);
  });
});

describe("UBB 导出器", () => {
  bench(`Markdown ${formatUtf8Size(mixedSmall)}`, () => {
    ubbToMarkdown(mixedSmall);
  });
  bench(`HTML ${formatUtf8Size(mixedSmall)}`, () => {
    ubbToHtml(mixedSmall);
  });
});
