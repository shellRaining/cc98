import { describe, expect, test } from "vite-plus/test";
import { z } from "zod";
import { formatBrowserLog } from "../src/lib/logger.ts";

describe("browser logger", () => {
  test("Zod 错误同时输出可读路径和结构化上下文", () => {
    const result = z
      .array(z.object({ mediaContent: z.object({ video: z.string() }) }))
      .safeParse([{ mediaContent: { video: null } }]);
    expect(result.success).toBe(false);
    if (result.success) return;
    result.error.stack =
      "ZodError\n    at queryFn (http://localhost:5173/src/api/queries/discovery.ts:36:34)";

    const log = formatBrowserLog({
      time: Date.UTC(2026, 6, 18),
      level: "error",
      scope: "query",
      msg: "查询失败",
      caller: "/src/lib/logger.ts:173:15",
      queryKey: ["topic", "new", "all", 20, 734053],
      err: result.error,
    });

    expect(log.text).toContain("ERROR [query] 查询失败");
    expect(log.text).toContain("at [0].mediaContent.video");
    expect(log.text).toContain('"expected": "string"');
    expect(log.text).toContain('"queryKey"');
    expect(log.text).toContain("错误位置：");
    expect(log.text).toContain("src/api/queries/discovery.ts:36:34");
    expect(log.text).not.toContain("日志调用点：/src/lib/logger.ts");
    expect(log.data.err).toMatchObject({
      name: "ZodError",
      details: expect.stringContaining("at [0].mediaContent.video"),
    });
  });

  test("循环引用和敏感字段不会破坏日志输出", () => {
    const context: Record<string, unknown> = {
      authorization: "Bearer secret",
      nested: {
        access_token: "secret",
        value: 1,
      },
    };
    context.self = context;

    const log = formatBrowserLog({
      time: Date.UTC(2026, 6, 18),
      level: "warn",
      scope: "http",
      msg: "API 请求失败",
      context,
    });

    expect(log.text).not.toContain("Bearer secret");
    expect(log.text).toContain("[已脱敏]");
    expect(log.text).toContain("[循环引用]");
    expect(log.data).toMatchObject({
      context: {
        authorization: "[已脱敏]",
        nested: {
          access_token: "[已脱敏]",
          value: 1,
        },
        self: "[循环引用]",
      },
    });
  });
});
