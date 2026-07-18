import { describe, expect, test } from "vite-plus/test";
import {
  boardTotalPages,
  clampPage,
  floorToPage,
  normalizeFloorHash,
  pageToFrom,
  paginationWindow,
  parsePageNumber,
  parsePositiveInt,
  topicTotalPages,
} from "../src/lib/route-params.ts";
import {
  isSafeInternalPath,
  saveLoginRedirect,
  takeLoginRedirect,
} from "../src/lib/login-redirect.ts";
import { normalizeApiError } from "../src/lib/api-error.ts";
import { queryKeys } from "../src/api/queries/index.ts";
import { FetchError } from "ofetch";
import { ZodError, z } from "zod";

describe("route-params", () => {
  test("解析正整数 ID", () => {
    expect(parsePositiveInt("12")).toBe(12);
    expect(parsePositiveInt("0")).toBeNull();
    expect(parsePositiveInt("-1")).toBeNull();
    expect(parsePositiveInt("abc")).toBeNull();
    expect(parsePositiveInt("12abc")).toBeNull();
    expect(parsePositiveInt("1.5")).toBeNull();
    expect(parsePositiveInt("9007199254740992")).toBeNull();
    expect(parsePositiveInt(undefined)).toBeNull();
  });

  test("页码缺省与非法回落", () => {
    expect(parsePageNumber(undefined)).toBe(1);
    expect(parsePageNumber("0")).toBe(1);
    expect(parsePageNumber("-3")).toBe(1);
    expect(parsePageNumber("4")).toBe(4);
  });

  test("page 与 from 换算", () => {
    expect(pageToFrom(1, 20)).toBe(0);
    expect(pageToFrom(2, 20)).toBe(20);
    expect(pageToFrom(3, 10)).toBe(20);
  });

  test("楼层与页码换算覆盖每页边界", () => {
    expect(floorToPage(1)).toBe(1);
    expect(floorToPage(10)).toBe(1);
    expect(floorToPage(11)).toBe(2);
    expect(floorToPage(20)).toBe(2);
    expect(floorToPage(21)).toBe(3);
  });

  test("主题总页数包含楼主", () => {
    expect(topicTotalPages(0)).toBe(1);
    expect(topicTotalPages(9)).toBe(1);
    expect(topicTotalPages(10)).toBe(2);
    expect(topicTotalPages(127)).toBe(13);
  });

  test("版面总页数与夹取", () => {
    expect(boardTotalPages(0)).toBe(1);
    expect(boardTotalPages(20)).toBe(1);
    expect(boardTotalPages(21)).toBe(2);
    expect(boardTotalPages(undefined)).toBeNull();
    expect(clampPage(99, 5)).toBe(5);
    expect(clampPage(0, 5)).toBe(1);
  });

  test("分页窗口与楼层 hash", () => {
    expect(paginationWindow(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(paginationWindow(5, 20)).toContain(1);
    expect(paginationWindow(5, 20)).toContain(20);
    expect(paginationWindow(5, 20)).toContain(null);
    expect(normalizeFloorHash("#10")).toBe("floor-10");
    expect(normalizeFloorHash("#floor-3")).toBe("floor-3");
    expect(normalizeFloorHash("#abc")).toBeNull();
  });
});

describe("login-redirect", () => {
  test("只接受站内绝对路径", () => {
    expect(isSafeInternalPath("/list/1")).toBe(true);
    expect(isSafeInternalPath("/topic/1/2#10")).toBe(true);
    expect(isSafeInternalPath("//evil.com")).toBe(false);
    expect(isSafeInternalPath("https://evil.com")).toBe(false);
    expect(isSafeInternalPath("topic/1")).toBe(false);
  });

  test("存取来源页时拒绝外链", () => {
    const store = new Map<string, string>();
    const fakeStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => {
        store.clear();
      },
    };
    Object.defineProperty(globalThis, "localStorage", {
      value: fakeStorage,
      configurable: true,
    });

    saveLoginRedirect("//evil.com");
    expect(takeLoginRedirect("/")).toBe("/");

    saveLoginRedirect("/list/758");
    expect(takeLoginRedirect("/")).toBe("/list/758");
    expect(takeLoginRedirect("/")).toBe("/");
  });
});

describe("api-error", () => {
  test("按状态码映射错误类别", () => {
    expect(normalizeApiError({ status: 401 }).kind).toBe("unauthorized");
    expect(normalizeApiError({ status: 403 }).kind).toBe("forbidden");
    expect(normalizeApiError({ status: 404 }).kind).toBe("not-found");
    expect(normalizeApiError({ status: 500 }).kind).toBe("server");
  });

  test("识别 FetchError 与 ZodError", () => {
    const fetchError = new FetchError("nope");
    fetchError.statusCode = 403;
    expect(normalizeApiError(fetchError).kind).toBe("forbidden");

    try {
      z.object({ id: z.number() }).parse({});
    } catch (error) {
      expect(error).toBeInstanceOf(ZodError);
      expect(normalizeApiError(error).kind).toBe("validation");
    }
  });
});

describe("reading-query-cache", () => {
  test("匿名状态和不同账号使用独立缓存", () => {
    expect(queryKeys.board(758, "anonymous")).not.toEqual(queryKeys.board(758, 1));
    expect(queryKeys.board(758, 1)).not.toEqual(queryKeys.board(758, 2));
    expect(queryKeys.topicPosts(1, 0, 10, 1)).not.toEqual(queryKeys.topicPosts(1, 0, 10, 2));
  });
});
