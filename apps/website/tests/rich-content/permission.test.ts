import { describe, expect, test } from "vite-plus/test";
import { resolvePermissionMessage } from "../../src/components/rich-content/ubb/permission.ts";

describe("权限提示标签", () => {
  test("按位置参数选择提示", () => {
    expect(resolvePermissionMessage("posteronly", "2")?.message).toContain("主题帖作者的发言");
    expect(resolvePermissionMessage("allowviewer", "1")?.tone).toBe("info");
  });

  test("缺少或越界参数稳定降级到默认提示", () => {
    const defaultMessage = resolvePermissionMessage("posteronly")?.message;
    expect(resolvePermissionMessage("posteronly", "99")?.message).toBe(defaultMessage);
    expect(resolvePermissionMessage("posteronly", "invalid")?.message).toBe(defaultMessage);
  });
});
