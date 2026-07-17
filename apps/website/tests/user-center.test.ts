import { describe, expect, test } from "vite-plus/test";
import { withoutCustomBoard, withoutId, withoutTopic } from "../src/api/mutations/index.ts";
import { queryKeys } from "../src/api/queries/index.ts";
import { getAvatarFrame } from "../src/lib/avatar-frame.ts";
import {
  normalizeFavoriteGroup,
  normalizeFavoriteKeyword,
  normalizeFavoriteOrder,
  normalizeMePostKind,
  orderByIds,
  pageCount,
  parseUserCenterPage,
  postExcerpt,
  joinBirthday,
  splitBirthday,
  userCenterPagePath,
  validateProfileSettings,
} from "../src/lib/user-center.ts";

describe("用户中心 URL 状态", () => {
  test("规范化页码与筛选条件", () => {
    expect(parseUserCenterPage(undefined)).toBe(1);
    expect(parseUserCenterPage("3")).toBe(3);
    expect(parseUserCenterPage("invalid")).toBe(1);
    expect(normalizeMePostKind("hot")).toBe("hot");
    expect(normalizeMePostKind("other")).toBe("recent");
    expect(normalizeFavoriteGroup("2")).toBe(2);
    expect(normalizeFavoriteGroup("-1")).toBe(0);
    expect(normalizeFavoriteOrder("1")).toBe(1);
    expect(normalizeFavoriteOrder("2")).toBe(2);
    expect(normalizeFavoriteOrder("3")).toBe(0);
    expect(normalizeFavoriteKeyword("  测试  ")).toBe("测试");
  });

  test("生成可恢复的查询路径", () => {
    expect(userCenterPagePath("/usercenter/topics", 1)).toBe("/usercenter/topics");
    expect(
      userCenterPagePath("/usercenter/favorites", 3, {
        group: 2,
        order: 1,
        keyword: "测试",
      }),
    ).toBe("/usercenter/favorites?group=2&order=1&keyword=%E6%B5%8B%E8%AF%95&page=3");
  });
});

describe("用户中心列表工具", () => {
  test("计算总页数并按 ID 恢复批量查询顺序", () => {
    expect(pageCount(0, 10)).toBe(1);
    expect(pageCount(21, 10)).toBe(3);
    expect(orderByIds([3, 1, 2], [{ id: 1 }, { id: 3 }])).toEqual([{ id: 3 }, { id: 1 }]);
  });

  test("帖子摘要转换 UBB 并限制长度", () => {
    expect(postExcerpt("[b]正文[/b]", 0)).toBe("正文");
    expect(postExcerpt("", 1)).toBe("(无可预览内容)");
    expect(postExcerpt("123456", 1, 4)).toBe("1234…");
  });

  test("管理操作只移除目标缓存项", () => {
    expect(withoutTopic([{ id: 1 }, { id: 2 }], 1)).toEqual([{ id: 2 }]);
    expect(withoutId([1, 2, 3], 2)).toEqual([1, 3]);
    expect(
      withoutCustomBoard(
        {
          id: 1,
          name: "测试用户",
          privilege: "",
          lockState: 0,
          customBoards: [1, 2],
        },
        1,
      )?.customBoards,
    ).toEqual([2]);
  });

  test("个人内容筛选条件隔离查询缓存", () => {
    expect(queryKeys.mePosts("recent", 0, 10, 1)).not.toEqual(queryKeys.mePosts("hot", 0, 10, 1));
    expect(queryKeys.meFavorites(0, 0, "", 0, 10, 1)).not.toEqual(
      queryKeys.meFavorites(1, 0, "", 0, 10, 1),
    );
    expect(queryKeys.meFavorites(0, 0, "a", 0, 10, 1)).not.toEqual(
      queryKeys.meFavorites(0, 0, "b", 0, 10, 1),
    );
  });

  test("资料设置解析生日并拒绝无效输入", () => {
    expect(splitBirthday("9999-6-18")).toEqual({ year: 9999, month: 6, day: 18 });
    expect(joinBirthday({ year: 0, month: 0, day: 0 })).toBeNull();
    expect(joinBirthday({ year: 2020, month: 6, day: 18 })).toBe("2020-6-18");
    expect(
      validateProfileSettings({
        email: "invalid",
        qq: "12345",
        birthday: { year: 0, month: 0, day: 0 },
      }),
    ).toBe("请检查邮箱地址");
    expect(
      validateProfileSettings({
        email: "test@example.com",
        qq: "abc",
        birthday: { year: 0, month: 0, day: 0 },
      }),
    ).toBe("请检查 QQ 是否正确");
    expect(
      validateProfileSettings({
        email: "test@example.com",
        qq: "12345",
        birthday: { year: 2023, month: 2, day: 29 },
      }),
    ).toBe("请检查生日是否正确");
  });
});

describe("用户头像框", () => {
  test("按旧站头衔编号映射共享资源与尺寸", () => {
    expect(getAvatarFrame(18)).toMatchObject({
      imageUrl: "/static/images/相框/版主.png",
      post: { width: "7.64rem", left: "-3.5rem", top: "-3.5rem" },
      profile: { width: "15rem", left: "-1.75rem", top: "-2rem" },
    });
    expect(getAvatarFrame(22)).toEqual(getAvatarFrame(18));
    expect(getAvatarFrame(104)?.keepPostShadow).toBe(true);
    expect(getAvatarFrame(7)).toBeNull();
    expect(getAvatarFrame(null)).toBeNull();
  });
});
