import type { ThemeSetting } from "@cc98/api";

/**
 * 主题三个正交维度：
 * - mode：明暗，决定底色和文字
 * - skin：皮肤，决定标识主色、头部背景图和点睛色（对应老论坛皮肤编号）
 * - style：整体风格方向（圆角/阴影/密度），首发只做 solid
 */
export type ThemeMode = "light" | "dark";
export type ThemeStyle = "solid" | "elegant" | "fluent";

/**
 * skin 标识。老论坛 30 个皮肤编号（0-29）归约到 21 个 skin：
 * 9 对亮暗配对皮肤（如春节亮/暗）合并成一个 skin，亮暗交给 mode 维度；
 * 12 个单色皮肤各自独立。编号互转见 {@link legacyThemeToSkin} / {@link skinToLegacyTheme}。
 */
export type SkinId =
  | "default"
  | "winter"
  | "spring"
  | "spring-deep"
  | "summer"
  | "autumn-orange"
  | "autumn-red"
  | "singles-day"
  | "mid-autumn"
  | "light-snow"
  | "spring-festival"
  | "mid-spring"
  | "dragon-boat"
  | "qingming"
  | "autumn-sky"
  | "warm-snow"
  | "spring-blossom"
  | "chongyang"
  | "golden-spring"
  | "new-year-flower"
  | "vast-sea";

interface SkinMeta {
  id: SkinId;
  /** 中文展示名 */
  name: string;
  /** 旧站主题中心的缩略图底色 */
  previewColor: string;
  /** 已迁移的卡片横幅资源 */
  previewImage: string;
  /** 老论坛亮色版编号（单色皮肤即唯一编号） */
  legacyLight: number;
  /** 老论坛暗色版编号，仅配对皮肤有 */
  legacyDark?: number;
}

/**
 * skin 元信息表。legacyLight/legacyDark 取自老论坛 themeList 的 order
 * （= UserInfo.theme = themeNames 下标）。配对关系取自老论坛 themeDayNightGroups。
 */
const SKINS: readonly SkinMeta[] = [
  {
    id: "default",
    name: "系统默认",
    previewColor: "#ffffff",
    previewImage: "/skins/summer/banner-card.jpg",
    legacyLight: 0,
  },
  {
    id: "winter",
    name: "冬季",
    previewColor: "#79b8ca",
    previewImage: "/skins/winter/banner-card.jpg",
    legacyLight: 1,
  },
  {
    id: "spring",
    name: "春季（浅）",
    previewColor: "#b1d396",
    previewImage: "/skins/spring/banner-card.jpg",
    legacyLight: 2,
  },
  {
    id: "spring-deep",
    name: "春季（深）",
    previewColor: "#95b675",
    previewImage: "/skins/spring-deep/banner-card.jpg",
    legacyLight: 3,
  },
  {
    id: "summer",
    name: "夏季",
    previewColor: "#5198d8",
    previewImage: "/skins/summer/banner-card.jpg",
    legacyLight: 4,
  },
  {
    id: "autumn-orange",
    name: "秋季（橙）",
    previewColor: "#f4a460",
    previewImage: "/skins/autumn-orange/banner-card.jpg",
    legacyLight: 5,
  },
  {
    id: "autumn-red",
    name: "秋季（红）",
    previewColor: "#b22222",
    previewImage: "/skins/autumn-red/banner-card.jpg",
    legacyLight: 6,
  },
  {
    id: "singles-day",
    name: "双十一交友",
    previewColor: "#f07d91",
    previewImage: "/skins/singles-day/banner-card.jpg",
    legacyLight: 7,
  },
  {
    id: "mid-autumn",
    name: "中秋",
    previewColor: "#34969f",
    previewImage: "/skins/mid-autumn/banner-card.jpg",
    legacyLight: 9,
    legacyDark: 8,
  },
  {
    id: "light-snow",
    name: "小雪",
    previewColor: "#7a92c2",
    previewImage: "/skins/light-snow/banner-card.jpg",
    legacyLight: 11,
    legacyDark: 10,
  },
  {
    id: "spring-festival",
    name: "春节",
    previewColor: "#d60e24",
    previewImage: "/skins/spring-festival/banner-card.jpg",
    legacyLight: 13,
    legacyDark: 12,
  },
  {
    id: "mid-spring",
    name: "仲春",
    previewColor: "#468d39",
    previewImage: "/skins/mid-spring/banner-card.jpg",
    legacyLight: 14,
  },
  {
    id: "dragon-boat",
    name: "端午",
    previewColor: "#3578bc",
    previewImage: "/skins/dragon-boat/banner-card.jpg",
    legacyLight: 15,
  },
  {
    id: "qingming",
    name: "清明",
    previewColor: "#6a8471",
    previewImage: "/skins/qingming/banner-card.jpg",
    legacyLight: 16,
  },
  {
    id: "autumn-sky",
    name: "秋色之空",
    previewColor: "#eb8e55",
    previewImage: "/skins/autumn-sky/banner-card.jpg",
    legacyLight: 18,
    legacyDark: 17,
  },
  {
    id: "warm-snow",
    name: "冬日暖雪",
    previewColor: "#b57fa3",
    previewImage: "/skins/warm-snow/banner-card.jpg",
    legacyLight: 20,
    legacyDark: 19,
  },
  {
    id: "spring-blossom",
    name: "春樱日和",
    previewColor: "#abc349",
    previewImage: "/skins/spring-blossom/banner-card.jpg",
    legacyLight: 22,
    legacyDark: 21,
  },
  {
    id: "chongyang",
    name: "重阳",
    previewColor: "#7a6d99",
    previewImage: "/skins/chongyang/banner-card.jpg",
    legacyLight: 24,
    legacyDark: 23,
  },
  {
    id: "golden-spring",
    name: "金舞迎春",
    previewColor: "#ff6754",
    previewImage: "/skins/golden-spring/banner-card.jpg",
    legacyLight: 26,
    legacyDark: 25,
  },
  {
    id: "new-year-flower",
    name: "新岁花朝",
    previewColor: "#df6c5d",
    previewImage: "/skins/new-year-flower/banner-card.jpg",
    legacyLight: 28,
    legacyDark: 27,
  },
  {
    id: "vast-sea",
    name: "沧海启明",
    previewColor: "#394676",
    previewImage: "/skins/vast-sea/banner-card.jpg",
    legacyLight: 29,
  },
];

const SKIN_BY_ID = new Map<SkinId, SkinMeta>(SKINS.map((s) => [s.id, s]));

/** 按 legacyLight 建立的编号→skin 反查表，暗色编号单独追加 */
const SKIN_BY_LEGACY = new Map<number, { skin: SkinId; mode?: ThemeMode }>();
for (const s of SKINS) {
  SKIN_BY_LEGACY.set(s.legacyLight, { skin: s.id, mode: s.legacyDark ? "light" : undefined });
  if (s.legacyDark !== undefined) {
    SKIN_BY_LEGACY.set(s.legacyDark, { skin: s.id, mode: "dark" });
  }
}

/** 全部 skin，按注册顺序 */
export const ALL_SKINS: readonly {
  id: SkinId;
  name: string;
  previewColor: string;
  previewImage: string;
}[] = SKINS.map((s) => ({
  id: s.id,
  name: s.name,
  previewColor: s.previewColor,
  previewImage: s.previewImage,
}));

/** 已落地旧站颜色变量和横幅资源的全部皮肤。 */
export const IMPLEMENTED_SKINS: ReadonlySet<SkinId> = new Set(SKINS.map((skin) => skin.id));

/** 该 skin 是否带亮暗配对（老论坛成对皮肤） */
export function isPairedSkin(skin: SkinId): boolean {
  return SKIN_BY_ID.get(skin)?.legacyDark !== undefined;
}

/**
 * 老论坛皮肤编号 → 新 { skin, mode? }。
 * 配对皮肤的编号会带出 mode（亮/暗），非配对皮肤 mode 为 undefined（mode 由用户独立控制）。
 * 越界或未知编号回退到 default。
 */
export function legacyThemeToSkin(theme: number): { skin: SkinId; mode?: ThemeMode } {
  return SKIN_BY_LEGACY.get(theme) ?? { skin: "default" };
}

/**
 * { skin, mode } → 老论坛皮肤编号，用于写回 PUT /me/theme。
 * 配对皮肤按 mode 选亮/暗编号，非配对皮肤返回唯一编号。
 */
export function skinToLegacyTheme(skin: SkinId, mode: ThemeMode): number {
  const meta = SKIN_BY_ID.get(skin);
  if (!meta) return 0;
  if (meta.legacyDark !== undefined && mode === "dark") return meta.legacyDark;
  return meta.legacyLight;
}

/**
 * 解析 "HH:mm:ss" 为当天零点起的分钟数。无法解析返回 null。
 */
function parseDayMinutes(raw: string | undefined): number | null {
  if (!raw) return null;
  const parts = raw.split(":").map(Number);
  if (parts.length < 2 || parts.some((n) => Number.isNaN(n))) return null;
  const [h, m, s = 0] = parts;
  if (h < 0 || h > 23 || m < 0 || m > 59 || s < 0 || s > 59) return null;
  return h * 60 + m;
}

/**
 * 按 ThemeSetting 的日夜规则推断当前应生效的 mode。
 * 返回 null 表示规则未启用或信息不足，调用方应回退到用户手动 mode。
 *
 * 优先级与老论坛一致：浏览器 prefers-color-scheme 优先，其次时间段。
 *
 * @param browserDark 浏览器 prefers-color-scheme 是否为 dark，不支持时传 null
 * @param now 当前时间，默认 new Date()，便于测试
 */
export function resolveAutoMode(
  setting: ThemeSetting | null | undefined,
  browserDark: boolean | null,
  now: Date = new Date(),
): ThemeMode | null {
  if (!setting?.enableDayNightSwitch) return null;

  if (browserDark !== null && setting.syncWithBrowserDayNightMode) {
    return browserDark ? "dark" : "light";
  }

  const dayStart = parseDayMinutes(setting.dayStartTime);
  const nightStart = parseDayMinutes(setting.nightStartTime);
  if (dayStart === null || nightStart === null) return null;

  const minutes = now.getHours() * 60 + now.getMinutes();
  // 处理跨夜区间：nightStart < dayStart 时夜间跨过零点（如 1:00-9:00）
  const isNight =
    nightStart < dayStart
      ? minutes >= nightStart && minutes < dayStart
      : minutes >= nightStart || minutes < dayStart;
  return isNight ? "dark" : "light";
}
