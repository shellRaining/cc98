import { describe, expect, it } from "vite-plus/test";
import { shouldAutoSignin, signinDay } from "../src/composables/useAutoSignin.ts";

const day = "2026-09-25";
const dataUpdatedAt = Date.parse("2026-09-25T08:00:00+08:00");
const base = { scope: 42, attemptedScope: null, day, attemptedDay: null, dataUpdatedAt };

describe("shouldAutoSignin - 自动签到触发判断", () => {
  it("开关开启、已登录且今日未签到时触发", () => {
    expect(shouldAutoSignin({ ...base, active: true, hasSignedInToday: false })).toBe(true);
  });

  it("今日已签到、签到状态未加载或开关关闭时不触发", () => {
    expect(shouldAutoSignin({ ...base, active: true, hasSignedInToday: true })).toBe(false);
    expect(shouldAutoSignin({ ...base, active: true, hasSignedInToday: undefined })).toBe(false);
    expect(shouldAutoSignin({ ...base, active: false, hasSignedInToday: false })).toBe(false);
  });

  it("跨过北京时间零点后，旧查询结果不能触发签到", () => {
    expect(signinDay(Date.parse("2026-09-24T15:59:59Z"))).toBe("2026-09-24");
    expect(signinDay(Date.parse("2026-09-24T16:00:00Z"))).toBe(day);
    expect(
      shouldAutoSignin({ ...base, active: true, hasSignedInToday: false, day: "2026-09-26" }),
    ).toBe(false);
  });

  it("同一账号当天只尝试一次，隔日可再次触发", () => {
    expect(
      shouldAutoSignin({
        ...base,
        active: true,
        hasSignedInToday: false,
        attemptedScope: 42,
        attemptedDay: day,
      }),
    ).toBe(false);
    expect(
      shouldAutoSignin({
        ...base,
        active: true,
        hasSignedInToday: false,
        day: "2026-09-26",
        dataUpdatedAt: Date.parse("2026-09-26T08:00:00+08:00"),
        attemptedScope: 42,
        attemptedDay: day,
      }),
    ).toBe(true);
  });

  it("切换到未尝试过的账号时重新触发", () => {
    expect(
      shouldAutoSignin({
        ...base,
        active: true,
        hasSignedInToday: false,
        scope: 43,
        attemptedScope: 42,
        attemptedDay: day,
      }),
    ).toBe(true);
  });
});
