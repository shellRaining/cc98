import { describe, expect, it } from "vite-plus/test";
import {
  DEFAULT_AVATAR_URL,
  normalizeAvatarUrl,
  resolveAvatarUrl,
} from "../src/components/user/avatar.ts";

describe("头像地址", () => {
  it("将 API 返回的 HTTP 地址升级为 HTTPS", () => {
    expect(normalizeAvatarUrl("http://www.cc98.org/static/images/default_avatar_girl.png")).toBe(
      "https://www.cc98.org/static/images/default_avatar_girl.png",
    );
  });

  it("跳过空地址并保留可用的后备头像", () => {
    expect(resolveAvatarUrl(" ", null, "http://www.cc98.org/avatar.png")).toBe(
      "https://www.cc98.org/avatar.png",
    );
    expect(resolveAvatarUrl()).toBe(DEFAULT_AVATAR_URL);
  });
});
