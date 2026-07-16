import { beforeEach, describe, expect, test, vi } from "vite-plus/test";
import {
  putHomepageCacheRefresh,
  putSiteAnnouncement,
  saveSiteManageColumn,
} from "../src/api/mutations/site-manage.ts";
import { typedPost, typedPut } from "../src/lib/http.ts";
import {
  createSiteManageColumnDraft,
  isSiteAdministrator,
  normalizeSiteManageColumn,
  siteManageColumnPayload,
  validateSiteManageColumn,
} from "../src/lib/site-manage.ts";

vi.mock("../src/lib/http.ts", () => ({
  typedPost: vi.fn(),
  typedPut: vi.fn(),
}));

describe("站点管理权限", () => {
  test("只认服务端管理员权限文案", () => {
    expect(isSiteAdministrator("管理员")).toBe(true);
    expect(isSiteAdministrator("超级版主")).toBe(false);
    expect(isSiteAdministrator("注册用户")).toBe(false);
    expect(isSiteAdministrator(undefined)).toBe(false);
  });
});

describe("首页栏目草稿", () => {
  test("Banner 新配置默认仅登录用户可见并保留 7 天", () => {
    expect(createSiteManageColumnDraft("advertisement")).toMatchObject({
      id: null,
      type: 4,
      enable: true,
      days: 7,
      visibility: 1,
      isNew: true,
    });
  });

  test("服务端缺省字段会归一成可编辑值", () => {
    expect(normalizeSiteManageColumn({ id: 98, title: "站衫" }, "specialOffer")).toEqual({
      id: 98,
      type: 7,
      title: "站衫",
      content: "",
      url: "",
      imageUrl: "",
      orderWeight: 0,
      enable: false,
      days: 0,
      expiredTime: null,
      visibility: 0,
      isNew: false,
    });
  });

  test("校验栏目特有字段", () => {
    const reading = createSiteManageColumnDraft("recommendationReading");
    reading.title = "迁移指南";
    reading.url = "/topic/1";
    reading.imageUrl = "/cover.png";
    expect(validateSiteManageColumn(reading, "recommendationReading")).toBe("请填写推荐内容");

    reading.content = "完整复刻旧站";
    expect(validateSiteManageColumn(reading, "recommendationReading")).toBeNull();

    const advertisement = createSiteManageColumnDraft("advertisement");
    advertisement.title = "Banner";
    advertisement.url = "https://www.cc98.org";
    advertisement.imageUrl = "/banner.png";
    advertisement.days = 0;
    expect(validateSiteManageColumn(advertisement, "advertisement")).toBe(
      "有效天数必须是大于 0 的整数",
    );
  });

  test("保存负载不包含客户端状态和服务端过期时间", () => {
    const draft = createSiteManageColumnDraft("recommendationFunction");
    draft.title = " 查 IP ";
    draft.url = " /user/ip ";
    draft.imageUrl = " /ip.png ";
    expect(siteManageColumnPayload(draft)).toEqual({
      type: 2,
      title: "查 IP",
      content: "",
      url: "/user/ip",
      imageUrl: "/ip.png",
      orderWeight: 0,
      enable: true,
      days: 0,
      visibility: 0,
    });
  });
});

describe("站点管理请求", () => {
  beforeEach(() => {
    vi.mocked(typedPost).mockReset();
    vi.mocked(typedPut).mockReset();
  });

  test("公告和首页缓存使用旧站接口", async () => {
    vi.mocked(typedPut).mockResolvedValue(undefined);
    await putSiteAnnouncement("公告");
    await putHomepageCacheRefresh();
    expect(typedPut).toHaveBeenNthCalledWith(1, "/config/global/announcement", {
      announcement: "公告",
    });
    expect(typedPut).toHaveBeenNthCalledWith(2, "/config/index/update");
  });

  test("新增和修改栏目使用不同请求", async () => {
    vi.mocked(typedPost).mockResolvedValue(undefined);
    vi.mocked(typedPut).mockResolvedValue(undefined);
    const draft = createSiteManageColumnDraft("specialOffer");
    draft.title = "福利";
    draft.url = "/topic/98";
    await saveSiteManageColumn(draft);
    expect(typedPost).toHaveBeenCalledWith("/index/column/", siteManageColumnPayload(draft));

    draft.id = 758;
    draft.isNew = false;
    await saveSiteManageColumn(draft);
    expect(typedPut).toHaveBeenCalledWith("/index/column/758", siteManageColumnPayload(draft));
  });
});
