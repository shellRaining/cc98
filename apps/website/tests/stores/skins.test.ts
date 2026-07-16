import { describe, expect, it } from "vite-plus/test";
import {
  ALL_SKINS,
  IMPLEMENTED_SKINS,
  isPairedSkin,
  legacyThemeToSkin,
  resolveAutoMode,
  skinToLegacyTheme,
  type SkinId,
  type ThemeMode,
} from "../../src/stores/skins.ts";
import type { ThemeSetting } from "@cc98/api";

// 固定一个日期，避免测试 flaky：2026-01-15 是个普通的星期四
function at(h: number, m: number): Date {
  return new Date(2026, 0, 15, h, m, 0);
}

describe("legacyThemeToSkin - 编号转 skin", () => {
  it.each<[number, SkinId, ThemeMode | undefined]>([
    [0, "default", undefined],
    // 配对皮肤：亮色编号带出 light
    [13, "spring-festival", "light"],
    [9, "mid-autumn", "light"],
    [18, "autumn-sky", "light"],
    [24, "chongyang", "light"],
    // 配对皮肤：暗色编号带出 dark
    [12, "spring-festival", "dark"],
    [8, "mid-autumn", "dark"],
    [17, "autumn-sky", "dark"],
    [23, "chongyang", "dark"],
    // 非配对皮肤：唯一编号，mode 为 undefined
    [4, "summer", undefined],
    [1, "winter", undefined],
    [7, "singles-day", undefined],
    [29, "vast-sea", undefined],
  ])("编号 %i → skin %s（mode %s）", (theme, skin, mode) => {
    expect(legacyThemeToSkin(theme)).toEqual({ skin, mode });
  });

  it.each([999, -1, 30, 100])("越界编号 %i 回退到 default", (theme) => {
    expect(legacyThemeToSkin(theme)).toEqual({ skin: "default", mode: undefined });
  });
});

describe("skinToLegacyTheme - skin 转编号", () => {
  it.each<[SkinId, ThemeMode, number]>([
    // 配对皮肤按 mode 选亮/暗编号
    ["spring-festival", "light", 13],
    ["spring-festival", "dark", 12],
    ["mid-autumn", "light", 9],
    ["mid-autumn", "dark", 8],
    ["chongyang", "light", 24],
    ["chongyang", "dark", 23],
    // 非配对皮肤无论 mode 都返回唯一编号
    ["summer", "light", 4],
    ["summer", "dark", 4],
    ["winter", "dark", 1],
    // default
    ["default", "light", 0],
    ["default", "dark", 0],
  ])("skin %s + %s → 编号 %i", (skin, mode, theme) => {
    expect(skinToLegacyTheme(skin, mode)).toBe(theme);
  });

  it("未知 skin（强制类型断言的越界值）安全回退到 0", () => {
    expect(skinToLegacyTheme("not-a-real-skin" as unknown as SkinId, "light")).toBe(0);
  });
});

describe("编号互转的对称性", () => {
  // 动态按注册表分区，保证覆盖全部 skin 而非手写漏项
  const paired = ALL_SKINS.map((s) => s.id).filter((id) => isPairedSkin(id));
  const nonPaired = ALL_SKINS.map((s) => s.id).filter((id) => !isPairedSkin(id));

  it.each(paired)("配对皮肤 %s：skin→编号→skin 往返一致", (skin) => {
    for (const mode of ["light", "dark"] as const) {
      const theme = skinToLegacyTheme(skin, mode);
      const back = legacyThemeToSkin(theme);
      expect(back.skin).toBe(skin);
      expect(back.mode).toBe(mode);
    }
  });

  it.each(nonPaired)("非配对皮肤 %s：编号→skin 往返一致，mode 为 undefined", (skin) => {
    const theme = skinToLegacyTheme(skin, "light");
    const back = legacyThemeToSkin(theme);
    expect(back.skin).toBe(skin);
    expect(back.mode).toBeUndefined();
  });
});

describe("isPairedSkin", () => {
  it.each<SkinId>([
    "spring-festival",
    "mid-autumn",
    "autumn-sky",
    "warm-snow",
    "spring-blossom",
    "chongyang",
    "golden-spring",
    "new-year-flower",
    "light-snow",
  ])("配对皮肤 %s → true", (skin) => {
    expect(isPairedSkin(skin)).toBe(true);
  });

  it.each<SkinId>(["default", "summer", "winter", "vast-sea", "singles-day"])(
    "非配对皮肤 %s → false",
    (skin) => {
      expect(isPairedSkin(skin)).toBe(false);
    },
  );
});

describe("resolveAutoMode", () => {
  it("setting 为 null → null", () => {
    expect(resolveAutoMode(null, null, at(12, 0))).toBeNull();
  });

  it("setting 为 undefined → null", () => {
    expect(resolveAutoMode(undefined, null, at(12, 0))).toBeNull();
  });

  it("enableDayNightSwitch 未开启 → null", () => {
    const setting: ThemeSetting = { enableDayNightSwitch: false };
    expect(resolveAutoMode(setting, true, at(12, 0))).toBeNull();
  });

  it("enableDayNightSwitch 缺省 → null", () => {
    const setting: ThemeSetting = { syncWithBrowserDayNightMode: true };
    expect(resolveAutoMode(setting, true, at(12, 0))).toBeNull();
  });

  describe("浏览器优先（syncWithBrowserDayNightMode）", () => {
    const setting: ThemeSetting = {
      enableDayNightSwitch: true,
      syncWithBrowserDayNightMode: true,
      dayStartTime: "08:00:00",
      nightStartTime: "23:00:00",
    };

    it("browserDark=true → dark", () => {
      expect(resolveAutoMode(setting, true, at(12, 0))).toBe("dark");
    });

    it("browserDark=false → light", () => {
      expect(resolveAutoMode(setting, false, at(23, 30))).toBe("light");
    });

    it("browserDark=null（浏览器不支持）→ 回退到时间段判定", () => {
      // 12:00 在白天区间，应判为 light
      expect(resolveAutoMode(setting, null, at(12, 0))).toBe("light");
    });
  });

  describe("时间段判定 - 普通区间（夜间不跨零点）", () => {
    const setting: ThemeSetting = {
      enableDayNightSwitch: true,
      dayStartTime: "08:00:00",
      nightStartTime: "23:00:00",
    };

    it("白天 12:00 → light", () => {
      expect(resolveAutoMode(setting, null, at(12, 0))).toBe("light");
    });

    it("夜间 23:30 → dark", () => {
      expect(resolveAutoMode(setting, null, at(23, 30))).toBe("dark");
    });

    it("恰好 dayStart 08:00 → light（白天起点）", () => {
      expect(resolveAutoMode(setting, null, at(8, 0))).toBe("light");
    });

    it("恰好 nightStart 23:00 → dark（夜间起点）", () => {
      expect(resolveAutoMode(setting, null, at(23, 0))).toBe("dark");
    });

    it("凌晨 00:30 → dark（< dayStart）", () => {
      expect(resolveAutoMode(setting, null, at(0, 30))).toBe("dark");
    });
  });

  describe("时间段判定 - 跨夜区间（夜间跨过零点）", () => {
    const setting: ThemeSetting = {
      enableDayNightSwitch: true,
      dayStartTime: "09:00:00",
      nightStartTime: "01:00:00",
    };

    it("凌晨 02:00 → dark", () => {
      expect(resolveAutoMode(setting, null, at(2, 0))).toBe("dark");
    });

    it("中午 12:00 → light", () => {
      expect(resolveAutoMode(setting, null, at(12, 0))).toBe("light");
    });

    it("刚进入夜间 01:30 → dark", () => {
      expect(resolveAutoMode(setting, null, at(1, 30))).toBe("dark");
    });

    it("白天起点 09:00 → light", () => {
      expect(resolveAutoMode(setting, null, at(9, 0))).toBe("light");
    });

    it("夜间起点前 00:30 → light（属白天区间 [09:00, 次日01:00)）", () => {
      expect(resolveAutoMode(setting, null, at(0, 30))).toBe("light");
    });

    it("夜间起点 01:00 → dark", () => {
      expect(resolveAutoMode(setting, null, at(1, 0))).toBe("dark");
    });
  });

  describe("时间段配置缺失或非法 → null", () => {
    it.each<[string | undefined, string | undefined]>([
      [undefined, "23:00:00"],
      ["08:00:00", undefined],
      [undefined, undefined],
      ["", "23:00:00"],
      ["08:00:00", ""],
      ["abc", "23:00:00"],
      ["08:00:00", "xyz"],
      ["25:00:00", "23:00:00"],
      ["08:00:00", "24:00:00"],
      ["08:60:00", "23:00:00"],
      ["08:00:00", "23:99:00"],
      ["08:00:00", "23:00:60"],
      ["08", "23:00:00"],
      ["08:00:00", "23"],
    ])("dayStartTime=%j nightStartTime=%j → null", (day, night) => {
      const setting: ThemeSetting = {
        enableDayNightSwitch: true,
        dayStartTime: day,
        nightStartTime: night,
      };
      expect(resolveAutoMode(setting, null, at(12, 0))).toBeNull();
    });
  });

  describe("时间相同的退化边界", () => {
    it("dayStart === nightStart 时恒为夜间（dark）", () => {
      const setting: ThemeSetting = {
        enableDayNightSwitch: true,
        dayStartTime: "12:00:00",
        nightStartTime: "12:00:00",
      };
      // 走普通分支（nightStart 不小于 dayStart），任意时刻都满足 >= night 或 < day
      expect(resolveAutoMode(setting, null, at(0, 0))).toBe("dark");
      expect(resolveAutoMode(setting, null, at(12, 0))).toBe("dark");
      expect(resolveAutoMode(setting, null, at(23, 59))).toBe("dark");
    });
  });
});

describe("皮肤注册表", () => {
  it("ALL_SKINS 覆盖全部 21 个 skin（老论坛 30 个编号归约）", () => {
    expect(ALL_SKINS).toHaveLength(21);
    // id 唯一
    const ids = ALL_SKINS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("IMPLEMENTED_SKINS 至少包含 default 与 spring-festival", () => {
    expect(IMPLEMENTED_SKINS.has("default")).toBe(true);
    expect(IMPLEMENTED_SKINS.has("spring-festival")).toBe(true);
  });
});
