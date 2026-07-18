import { beforeEach, describe, expect, test, vi } from "vite-plus/test";
import { topicEventPageSchema } from "@cc98/api";
import {
  batchModerateTopics,
  moderatePost,
  moderateTopic,
  type TopicModerationRequest,
} from "../src/api/mutations/moderation.ts";
import {
  canManagePost,
  hasTopicAuthorManagement,
  isBoardManager,
  resolveTopicModerationAccess,
} from "../src/components/moderation/access.ts";
import { typedDelete, typedPost, typedPut } from "../src/lib/http.ts";
import { validateBatchTopicModerationRequest } from "../src/views/board/components/board-batch-moderation.ts";
import { validatePostModerationRequest } from "../src/views/topic/components/post-moderation.ts";
import {
  flattenModerationBoards,
  validateTopicModerationRequest,
} from "../src/views/topic/components/topic-moderation.ts";

vi.mock("../src/lib/http.ts", () => ({
  typedDelete: vi.fn(),
  typedPost: vi.fn(),
  typedPut: vi.fn(),
}));

const moderator = { id: 1, name: "版主甲", avatarUrl: null, privilege: "注册用户" };
const normalUser = { id: 2, name: "普通用户", avatarUrl: null, privilege: "注册用户" };
const board = { id: 81, name: "编程技术", boardMasters: ["版主甲"] };

describe("主题版务权限", () => {
  test("管理员、超级版主和当前版主拥有完整权限", () => {
    expect(isBoardManager({ ...normalUser, privilege: "管理员" }, board)).toBe(true);
    expect(isBoardManager({ ...normalUser, privilege: "超级版主" }, board)).toBe(true);
    expect(isBoardManager(moderator, board)).toBe(true);
    expect(isBoardManager(normalUser, board)).toBe(false);
  });

  test("主题作者只有服务端返回作者权限时才看到受限入口", () => {
    expect(
      hasTopicAuthorManagement(normalUser, {
        id: 100,
        userId: normalUser.id,
        topicAuthorPermissions: ["lock"],
      }),
    ).toBe(true);
    expect(
      hasTopicAuthorManagement(normalUser, {
        id: 100,
        userId: normalUser.id,
        topicAuthorPermissions: [],
      }),
    ).toBe(false);
  });

  test("普通用户不渲染任何主题版务入口，作者不能查看 IP", () => {
    expect(resolveTopicModerationAccess(normalUser, board, { id: 100, userId: 3 })).toEqual({
      canManage: false,
      canViewHistory: false,
      canViewIp: false,
    });
    expect(
      resolveTopicModerationAccess(normalUser, board, {
        id: 100,
        userId: normalUser.id,
        topicAuthorPermissions: ["any"],
      }),
    ).toEqual({ canManage: true, canViewHistory: true, canViewIp: false });
  });

  test("楼层管理保留完整权限和 144 版面作者特例", () => {
    expect(canManagePost(moderator, board, { id: 100, userName: "楼主" })).toBe(true);
    expect(canManagePost(normalUser, { id: 144 }, { id: 100, userName: normalUser.name })).toBe(
      true,
    );
    expect(canManagePost(normalUser, board, { id: 100, userName: normalUser.name })).toBe(false);
  });
});

describe("主题版务表单", () => {
  test("扁平化版面分组并忽略缺失 ID 的版面", () => {
    expect(
      flattenModerationBoards([
        { id: 1, name: "分区一", boards: [{ id: 81, name: "编程技术" }, { name: "隐藏" }] },
        { id: 2, name: "分区二", boards: [{ id: 68, name: "校园信息" }] },
      ]),
    ).toEqual([
      { id: 81, name: "编程技术" },
      { id: 68, name: "校园信息" },
    ]);
  });

  test("校验理由、有效天数、目标版面与高亮颜色", () => {
    expect(validateTopicModerationRequest({ action: "bump", topicId: 1, reason: "" })).toBe(
      "请输入操作理由",
    );
    expect(
      validateTopicModerationRequest({ action: "lock", topicId: 1, reason: "测试", days: 0 }),
    ).toBe("请选择有效天数");
    expect(validateTopicModerationRequest({ action: "move", topicId: 1, reason: "测试" })).toBe(
      "请选择目标版面",
    );
    expect(
      validateTopicModerationRequest({
        action: "highlight",
        topicId: 1,
        reason: "测试",
        days: 7,
        color: "red",
      }),
    ).toBe("请选择合法的高亮颜色");
  });
});

describe("楼层版务表单", () => {
  test("奖励、TP 和解除 TP 校验各自必填字段", () => {
    expect(
      validatePostModerationRequest({
        action: "reward-wealth",
        postId: 1,
        boardId: 81,
        reason: "好文章",
        value: 0,
      }),
    ).toBe("请输入大于 0 的整数");
    expect(
      validatePostModerationRequest({
        action: "mute",
        postId: 1,
        boardId: 81,
        reason: "违反版规",
        days: 0,
      }),
    ).toBe("请输入有效天数");
    expect(
      validatePostModerationRequest({
        action: "unmute",
        postId: 1,
        boardId: 81,
        reason: "",
      }),
    ).toBe("该楼层缺少用户信息，无法解除 TP");
  });
});

describe("版面批量管理", () => {
  test("要求选择主题、填写理由和锁沉天数", () => {
    expect(
      validateBatchTopicModerationRequest({ action: "delete", topicIds: [], reason: "重复发帖" }),
    ).toBe("请至少选择一个主题");
    expect(
      validateBatchTopicModerationRequest({ action: "lock", topicIds: [1], reason: "", days: 7 }),
    ).toBe("请输入操作理由");
    expect(
      validateBatchTopicModerationRequest({
        action: "lock",
        topicIds: [1],
        reason: "管理要求",
        days: 0,
      }),
    ).toBe("请选择有效天数");
  });

  test("批量锁沉和删除使用重复 id 查询参数", async () => {
    vi.mocked(typedPut).mockReset().mockResolvedValue(undefined);
    await batchModerateTopics({
      action: "lock",
      topicIds: [101, 102],
      reason: "管理要求",
      days: 30,
    });
    expect(typedPut).toHaveBeenNthCalledWith(
      1,
      "/topic/multi-lock",
      { reason: "管理要求", value: 30 },
      { query: { id: [101, 102] } },
    );
    await batchModerateTopics({ action: "delete", topicIds: [101], reason: "重复发帖" });
    expect(typedPut).toHaveBeenNthCalledWith(
      2,
      "/topic/multi-delete",
      { reason: "重复发帖" },
      { query: { id: [101] } },
    );
  });
});

describe("主题版务请求", () => {
  beforeEach(() => {
    vi.mocked(typedDelete).mockReset().mockResolvedValue(undefined);
    vi.mocked(typedPut).mockReset().mockResolvedValue(undefined);
  });

  const reason = "  版务测试  ";
  const cases: Array<{
    name: string;
    request: TopicModerationRequest;
    method: "PUT" | "DELETE";
    path: string;
    payload: unknown;
  }> = [
    {
      name: "锁定",
      request: { action: "lock", topicId: 98, reason, days: 7 },
      method: "PUT",
      path: "/topic/98/lock",
      payload: { reason: "版务测试", value: 7 },
    },
    {
      name: "解锁",
      request: { action: "unlock", topicId: 98, reason },
      method: "DELETE",
      path: "/topic/98/lock",
      payload: { body: { reason: "版务测试" } },
    },
    {
      name: "禁止热门",
      request: { action: "disable-hot", topicId: 98, reason },
      method: "PUT",
      path: "/topic/98/not-hot",
      payload: { reason: "版务测试" },
    },
    {
      name: "允许热门",
      request: { action: "enable-hot", topicId: 98, reason },
      method: "DELETE",
      path: "/topic/98/not-hot",
      payload: { body: { reason: "版务测试" } },
    },
    {
      name: "删除",
      request: { action: "delete", topicId: 98, reason },
      method: "DELETE",
      path: "/topic/98",
      payload: { body: { reason: "版务测试" } },
    },
    {
      name: "移动",
      request: { action: "move", topicId: 98, reason, targetBoardId: 81 },
      method: "PUT",
      path: "/topic/98/moveto/81",
      payload: { reason: "版务测试" },
    },
    {
      name: "提升",
      request: { action: "bump", topicId: 98, reason },
      method: "PUT",
      path: "/topic/98/up",
      payload: { reason: "版务测试" },
    },
    {
      name: "版面固顶",
      request: { action: "set-board-top", topicId: 98, reason, days: 14 },
      method: "PUT",
      path: "/topic/98/top",
      payload: { topState: 2, duration: 14, reason: "版务测试" },
    },
    {
      name: "全站固顶",
      request: { action: "set-global-top", topicId: 98, reason, days: 30 },
      method: "PUT",
      path: "/topic/98/top",
      payload: { topState: 4, duration: 30, reason: "版务测试" },
    },
    {
      name: "取消固顶",
      request: { action: "remove-top", topicId: 98, reason },
      method: "DELETE",
      path: "/topic/98/top",
      payload: { body: { reason: "版务测试" } },
    },
    {
      name: "加精",
      request: { action: "set-best", topicId: 98, reason },
      method: "PUT",
      path: "/topic/98/best",
      payload: { reason: "版务测试" },
    },
    {
      name: "解除精华",
      request: { action: "remove-best", topicId: 98, reason },
      method: "DELETE",
      path: "/topic/98/best",
      payload: { body: { reason: "版务测试" } },
    },
    {
      name: "高亮",
      request: {
        action: "highlight",
        topicId: 98,
        reason,
        days: 98,
        isBold: true,
        isItalic: false,
        color: "#5198d8",
      },
      method: "PUT",
      path: "/topic/98/highlight",
      payload: {
        isBold: true,
        isItalic: false,
        color: "#5198d8",
        duration: 98,
        reason: "版务测试",
      },
    },
  ];

  for (const item of cases) {
    test(`${item.name}沿用旧站方法、路径和负载`, async () => {
      await moderateTopic(item.request);
      if (item.method === "PUT") {
        expect(typedPut).toHaveBeenCalledWith(item.path, item.payload);
        expect(typedDelete).not.toHaveBeenCalled();
      } else {
        expect(typedDelete).toHaveBeenCalledWith(item.path, item.payload);
        expect(typedPut).not.toHaveBeenCalled();
      }
    });
  }
});

describe("楼层版务请求", () => {
  beforeEach(() => {
    vi.mocked(typedDelete).mockReset().mockResolvedValue(undefined);
    vi.mocked(typedPost).mockReset().mockResolvedValue(undefined);
  });

  test.each([
    ["奖励财富", "reward-wealth", { operationType: 0, reason: "好文章", wealth: 1000 }],
    ["奖励威望", "reward-prestige", { operationType: 0, reason: "好文章", prestige: 2 }],
    ["扣除财富", "deduct-wealth", { operationType: 1, reason: "违反版规", wealth: 100 }],
    ["扣除威望", "deduct-prestige", { operationType: 1, reason: "违反版规", prestige: 1 }],
  ] as const)("%s使用楼层 operation 接口", async (_name, action, payload) => {
    await moderatePost({
      action,
      postId: 7598001,
      boardId: 81,
      reason: payload.reason,
      value: "wealth" in payload ? payload.wealth : payload.prestige,
    });
    expect(typedPost).toHaveBeenCalledWith("/post/7598001/operation", payload);
  });

  test("TP、删除和解除 TP 使用旧站接口", async () => {
    await moderatePost({
      action: "mute",
      postId: 7598001,
      boardId: 81,
      userId: 2002,
      reason: "违反版规",
      days: 7,
    });
    expect(typedPost).toHaveBeenCalledWith("/post/7598001/operation", {
      operationType: 1,
      reason: "违反版规",
      stopPostDays: 7,
    });

    await moderatePost({
      action: "delete",
      postId: 7598001,
      boardId: 81,
      reason: "重复内容",
    });
    expect(typedDelete).toHaveBeenCalledWith("/post/7598001", {
      body: { reason: "重复内容" },
    });

    await moderatePost({
      action: "unmute",
      postId: 7598001,
      boardId: 81,
      userId: 2002,
      reason: "",
    });
    expect(typedDelete).toHaveBeenCalledWith("/board/81/stop-post-user/2002");
  });
});

describe("主题管理记录契约", () => {
  test("解析旧站分页 envelope 和可空数据", () => {
    expect(
      topicEventPageSchema.parse({
        data: null,
        count: 0,
        from: 0,
        size: 0,
        extra: null,
        errorCode: 3001,
      }),
    ).toMatchObject({ data: null, count: 0, errorCode: 3001 });

    expect(
      topicEventPageSchema.parse({
        data: [
          {
            id: 1,
            content: "锁定主题",
            targetUserName: null,
            time: "2026-07-18T10:00:00+08:00",
            operatorUserName: "版主甲",
            ip: "10.0.0.1",
          },
        ],
        count: 1,
        from: 0,
        size: 7,
        extra: null,
        errorCode: 0,
      }).data,
    ).toHaveLength(1);
  });
});
