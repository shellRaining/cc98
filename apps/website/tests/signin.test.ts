import { describe, expect, test, vi } from "vite-plus/test";
import { typedPost } from "../src/lib/http.ts";
import { postSignin } from "../src/api/mutations/signin.ts";

vi.mock("../src/lib/http.ts", () => ({
  typedPost: vi.fn(),
}));

describe("签到请求", () => {
  test("签到留言以字符串请求体提交", async () => {
    const request = vi.mocked(typedPost);
    request.mockResolvedValue(undefined);

    await expect(postSignin("今日签到")).resolves.toBeUndefined();

    expect(request).toHaveBeenCalledWith("/me/signin", "今日签到", {
      headers: { "Content-Type": "application/json" },
    });
  });
});
