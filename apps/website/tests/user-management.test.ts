import { beforeEach, describe, expect, test, vi } from "vite-plus/test";
import { userModerationPostPageSchema } from "@cc98/api";
import { deleteUserContent, manageUser } from "../src/api/mutations/user-management.ts";
import { typedDelete, typedPut } from "../src/lib/http.ts";
import {
  validateUserContentDays,
  validateUserManagementOperation,
} from "../src/lib/user-management.ts";

vi.mock("../src/lib/http.ts", () => ({
  typedDelete: vi.fn(),
  typedPut: vi.fn(),
}));

describe("用户管理表单", () => {
  test("TP 只接受永久或 7 至 1000 天", () => {
    const request = {
      userId: 2002,
      punishmentType: 3 as const,
      operationType: 1 as const,
      reason: "违反站规",
      days: 7,
    };

    expect(validateUserManagementOperation({ ...request, days: -1 })).toBeNull();
    expect(validateUserManagementOperation(request)).toBeNull();
    expect(validateUserManagementOperation({ ...request, days: 1000 })).toBeNull();
    expect(validateUserManagementOperation({ ...request, days: 6 })).toBe(
      "TP 天数只能是 -1，或 7 至 1000 之间的整数",
    );
    expect(validateUserManagementOperation({ ...request, days: 1001 })).toBe(
      "TP 天数只能是 -1，或 7 至 1000 之间的整数",
    );
  });

  test("删除与查看范围只接受 1 至 365 天", () => {
    expect(validateUserContentDays(1)).toBeNull();
    expect(validateUserContentDays(365)).toBeNull();
    expect(validateUserContentDays(0)).toBe("天数必须是 1 至 365 之间的整数");
    expect(validateUserContentDays(366)).toBe("天数必须是 1 至 365 之间的整数");
    expect(validateUserContentDays(7.5)).toBe("天数必须是 1 至 365 之间的整数");
  });
});

describe("用户管理请求", () => {
  beforeEach(() => {
    vi.mocked(typedDelete).mockReset().mockResolvedValue(0);
    vi.mocked(typedPut).mockReset().mockResolvedValue(undefined);
  });

  test("全站处罚沿用 PascalCase 负载", async () => {
    await manageUser({
      userId: 2002,
      punishmentType: 3,
      operationType: 1,
      reason: "  违反站规  ",
      days: 30,
    });

    expect(typedPut).toHaveBeenCalledWith("/user/2002/operation", {
      PunishmentType: 3,
      OperationType: 1,
      Reason: "违反站规",
      Days: 30,
    });
  });

  test("删除主题与回复使用旧站路径和天数参数", async () => {
    await deleteUserContent({ userId: 2002, kind: "topic", days: 7 });
    await deleteUserContent({ userId: 2002, kind: "post", days: 30 });

    expect(typedDelete).toHaveBeenNthCalledWith(1, "/user/2002/topic", {
      query: { days: 7 },
    });
    expect(typedDelete).toHaveBeenNthCalledWith(2, "/user/2002/post", {
      query: { days: 30 },
    });
  });
});

describe("用户管理发言响应", () => {
  test("保留分页总数、版面、楼层、IP 和已删除记录", () => {
    const result = userModerationPostPageSchema.parse({
      postInfos: [
        {
          boardId: 81,
          content: "正常楼层",
          floor: 2,
          ip: "10.0.0.1",
          time: "2026-07-18T08:00:00+08:00",
          topicId: 123,
        },
        {
          boardId: 81,
          content: "已删除内容",
          floor: -1,
          ip: "10.0.0.2",
          time: "2026-07-18T09:00:00+08:00",
          topicId: 124,
        },
      ],
      count: 13,
    });

    expect(result.count).toBe(13);
    expect(result.postInfos).toHaveLength(2);
    expect(result.postInfos[0]).toMatchObject({ boardId: 81, floor: 2, topicId: 123 });
    expect(result.postInfos[1]?.floor).toBe(-1);
  });
});
