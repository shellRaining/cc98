import { describe, expect, test } from "vite-plus/test";
import {
  loadMessageSettings,
  saveMessageSettings,
  shouldJumpToLatestReply,
  type MessageSettings,
} from "../src/stores/message-settings.ts";

function createStorage(initial?: string) {
  let value = initial ?? null;
  return {
    getItem: () => value,
    setItem: (_key: string, next: string) => {
      value = next;
    },
  };
}

describe("消息设置存储", () => {
  test("缺失或损坏数据回退默认值", () => {
    expect(loadMessageSettings(createStorage())).toMatchObject({ post: "否", response: "是" });
    expect(loadMessageSettings(createStorage("{broken"))).toMatchObject({
      post: "否",
      response: "是",
    });
  });

  test("保存后控制主题页是否跳到最新回复", () => {
    const storage = createStorage();
    const settings: MessageSettings = {
      response: "是",
      attme: "是",
      system: "是",
      message: "是",
      post: "是",
    };
    saveMessageSettings(settings, storage);
    expect(loadMessageSettings(storage)).toEqual(settings);
    expect(shouldJumpToLatestReply(storage)).toBe(true);
  });
});
