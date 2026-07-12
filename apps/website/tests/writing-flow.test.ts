import { describe, expect, test } from "vite-plus/test";
import {
  fileUploadResponseSchema,
  voteInfoSchema,
  type CreateVoteInfo,
  type RatingReason,
} from "@cc98/api";
import { favoriteCacheQueryKeys } from "../src/api/mutations/me.ts";
import { clearDraft, createDraftKey, readDraft, writeDraft } from "../src/lib/drafts.ts";
import {
  availableRatingReasons,
  appendMarkdownBlock,
  createAttachmentMarkdown,
  createVotePayload,
  nextLikeState,
  validateCreateVote,
} from "../src/lib/interactions.ts";

function createStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

describe("写作草稿", () => {
  test("按操作类型和目标隔离并可在成功后清理", () => {
    const storage = createStorage();
    const createKey = createDraftKey("create-topic", 10);
    const replyKey = createDraftKey("reply", 10);
    writeDraft(createKey, { content: "主题草稿" }, storage);
    writeDraft(replyKey, { content: "回复草稿" }, storage);

    expect(readDraft(createKey, { content: "" }, storage).content).toBe("主题草稿");
    expect(readDraft(replyKey, { content: "" }, storage).content).toBe("回复草稿");

    clearDraft(createKey, storage);
    expect(readDraft(createKey, { content: "" }, storage).content).toBe("");
    expect(readDraft(replyKey, { content: "" }, storage).content).toBe("回复草稿");
  });

  test("损坏或非对象草稿回退默认值", () => {
    const storage = createStorage();
    const key = createDraftKey("edit", 20);
    storage.setItem(key, "{broken");
    expect(readDraft(key, { title: "默认", content: "" }, storage)).toEqual({
      title: "默认",
      content: "",
    });

    storage.setItem(key, JSON.stringify(["unexpected"]));
    expect(readDraft(key, { content: "" }, storage)).toEqual({ content: "" });
  });
});

describe("上传响应契约", () => {
  test("仅接受非空字符串数组", () => {
    expect(fileUploadResponseSchema.parse(["https://file.cc98.org/a.png"])).toHaveLength(1);
    expect(() => fileUploadResponseSchema.parse([""])).toThrow();
    expect(() => fileUploadResponseSchema.parse([1])).toThrow();
  });

  test("多附件生成 Markdown 链接并追加到正文", () => {
    const block = createAttachmentMarkdown(
      ["报告.pdf", "数据[最终].zip"],
      ["https://file.cc98.org/report.pdf", "https://file.cc98.org/data.zip"],
    );
    expect(block).toBe(
      "[报告.pdf](https://file.cc98.org/report.pdf)\n[数据\\[最终\\].zip](https://file.cc98.org/data.zip)",
    );
    expect(appendMarkdownBlock("正文", block)).toBe(`正文\n\n${block}`);
    expect(() => createAttachmentMarkdown(["a.txt"], [])).toThrow("数量不一致");
  });
});

describe("楼层点赞状态", () => {
  test("同向操作取消，反向操作切换并保持计数非负", () => {
    expect(nextLikeState({ likeCount: 3, dislikeCount: 2, likeState: 1 }, "1")).toEqual({
      likeCount: 2,
      dislikeCount: 2,
      likeState: 0,
    });
    expect(nextLikeState({ likeCount: 3, dislikeCount: 2, likeState: 1 }, "2")).toEqual({
      likeCount: 2,
      dislikeCount: 3,
      likeState: 2,
    });
    expect(nextLikeState({ likeCount: 0, dislikeCount: 0, likeState: 2 }, "1")).toEqual({
      likeCount: 1,
      dislikeCount: 0,
      likeState: 1,
    });
  });
});

describe("评分理由", () => {
  test("只保留当前评分方向中启用的理由", () => {
    const reasons: RatingReason[] = [
      { id: 1, reason: "有帮助", type: 1, enabled: true },
      { id: 2, reason: "已停用", type: 1, enabled: false },
      { id: 3, reason: "不友善", type: 2, enabled: true },
    ];
    expect(availableRatingReasons(reasons, 1).map((reason) => reason.id)).toEqual([1]);
    expect(availableRatingReasons(reasons, 2).map((reason) => reason.id)).toEqual([3]);
  });
});

describe("投票校验", () => {
  const validVote: CreateVoteInfo = {
    voteItems: ["选项一", "选项二"],
    expiredDays: 7,
    maxVoteCount: 1,
    needVote: false,
  };

  test("创建投票覆盖天数、空选项和最大选择数边界", () => {
    expect(validateCreateVote(validVote)).toBeNull();
    expect(validateCreateVote({ ...validVote, expiredDays: 0 })).toContain("有效天数");
    expect(validateCreateVote({ ...validVote, voteItems: ["选项一", " "] })).toContain("不能为空");
    expect(validateCreateVote({ ...validVote, maxVoteCount: 3 })).toContain("最多可选");
  });

  test("提交时去重并拒绝越权、超量和空选择", () => {
    expect(createVotePayload([2, 2, 1], [1, 2, 3], 2)).toEqual({
      payload: { items: [2, 1] },
    });
    expect(createVotePayload([], [1, 2], 1).error).toContain("至少选择");
    expect(createVotePayload([1, 2], [1, 2], 1).error).toContain("最多");
    expect(createVotePayload([3], [1, 2], 1).error).toContain("已失效");
  });

  test("公共契约解析旧前端可证实的投票字段", () => {
    const result = voteInfoSchema.parse({
      topicId: 10,
      voteItems: [{ id: 1, description: "选项", count: 2 }],
      voteRecords: [{ userId: 3, userName: "用户", items: [1], ip: "", time: "2026-01-01" }],
      myRecord: null,
      canVote: true,
      maxVoteCount: 1,
    });
    expect(result.voteItems?.[0]?.description).toBe("选项");
    expect(result.voteRecords?.[0]?.items).toEqual([1]);
  });
});

describe("收藏缓存同步", () => {
  test("收藏变化覆盖主题状态、列表、分组和当前用户", () => {
    expect(favoriteCacheQueryKeys(42)).toEqual([
      ["topic", 42, "favorite"],
      ["me", "favorites"],
      ["me", "favorite-groups"],
      ["current-user"],
    ]);
  });
});
