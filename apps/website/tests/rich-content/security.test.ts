import { describe, expect, test } from "vite-plus/test";
import { defaultRichContentOptions } from "../../src/components/rich-content/options.ts";
import {
  sanitizeImageUrl,
  sanitizeLinkUrl,
  sanitizeMediaUrl,
} from "../../src/components/rich-content/security.ts";

describe("富内容 URL 安全", () => {
  test.each(["javascript:alert(1)", "data:text/html,hello", "file:///tmp/a", "//evil.example/a"])(
    "拒绝危险链接 %s",
    (url) => {
      expect(sanitizeLinkUrl(url, defaultRichContentOptions)).toBeNull();
      expect(sanitizeImageUrl(url, defaultRichContentOptions)).toBeNull();
      expect(sanitizeMediaUrl(url, defaultRichContentOptions)).toBeNull();
    },
  );

  test("允许站内相对地址和 HTTPS", () => {
    expect(sanitizeLinkUrl("/topic/1", defaultRichContentOptions)).toBe("/topic/1");
    expect(sanitizeImageUrl("https://example.com/a.png", defaultRichContentOptions)).toBe(
      "https://example.com/a.png",
    );
  });

  test("外链开关分别约束链接和图片", () => {
    expect(
      sanitizeLinkUrl("https://example.com", {
        ...defaultRichContentOptions,
        allowExternalUrl: false,
      }),
    ).toBeNull();
    expect(
      sanitizeImageUrl("https://example.com/a.png", {
        ...defaultRichContentOptions,
        allowExternalImage: false,
      }),
    ).toBeNull();
  });
});
