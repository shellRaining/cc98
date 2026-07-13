import { describe, expect, test, vi } from "vite-plus/test";
import { typedPost } from "../src/lib/http.ts";
import { postSignin } from "../src/api/mutations/signin.ts";

vi.mock("../src/lib/http.ts", () => ({
  typedPost: vi.fn(),
}));

describe("签到请求", () => {
  test("空请求体仍声明为 JSON，避免被浏览器识别为 text/plain", async () => {
    const request = vi.mocked(typedPost);
    request.mockResolvedValue(undefined);

    await expect(postSignin()).resolves.toBeUndefined();

    expect(request).toHaveBeenCalledWith("/me/signin", undefined, {
      headers: { "Content-Type": "application/json" },
    });
  });
});
