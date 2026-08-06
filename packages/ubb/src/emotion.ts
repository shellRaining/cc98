export type UbbEmotionFamily =
  | "em"
  | "ac"
  | "ms"
  | "cc98"
  | "tb"
  | "mahjong-animal"
  | "mahjong-cartoon"
  | "mahjong-face";

export interface UbbEmotionDescriptor {
  family: UbbEmotionFamily;
  code: string;
  src: string;
  alt: string;
}

const ASSET_BASE = "https://www.cc98.org/static/images";
const CARTOON_GIFS = new Set([18, 49, 96]);
const FACE_GIFS = new Set([4, 9, 56, 61, 62, 87, 115, 120, 137, 168, 169, 175, 206]);

interface EmotionFamilySpec {
  /** UBB 标签前缀：`[ac01]` 的 `ac`、`[a:001]` 的 `a:`。 */
  tagPrefix: string;
  /** 中文展示名，与编号拼成 Markdown 图片 alt。 */
  label: string;
  /** 全部合法编号，顺序即官方表情面板顺序。 */
  codes: string[];
  src: (code: string) => string;
}

function codeRange(start: number, end: number, width: number): string[] {
  return Array.from({ length: end - start + 1 }, (_, index) =>
    String(start + index).padStart(width, "0"),
  );
}

/** 表情编号范围与资源规则的唯一事实源：解析标签与枚举面板都从这里派生。 */
const FAMILY_SPECS: Record<UbbEmotionFamily, EmotionFamilySpec> = {
  em: {
    tagPrefix: "em",
    label: "经典表情",
    codes: codeRange(0, 91, 2),
    src: (code) => `${ASSET_BASE}/em/em${code}.gif`,
  },
  ac: {
    tagPrefix: "ac",
    label: "AC娘",
    codes: [...codeRange(1, 54, 2), ...codeRange(1001, 1040, 4), ...codeRange(2001, 2055, 4)],
    src: (code) => `${ASSET_BASE}/ac/${code}.png`,
  },
  ms: {
    tagPrefix: "ms",
    label: "雀魂",
    codes: codeRange(1, 54, 2),
    src: (code) => `${ASSET_BASE}/ms/ms${code}.png`,
  },
  cc98: {
    tagPrefix: "cc98",
    label: "CC98",
    codes: codeRange(1, 37, 2),
    src: (code) => {
      const value = Number(code);
      const extension = (value >= 15 && value <= 30) || value >= 36 ? "png" : "gif";
      return `${ASSET_BASE}/CC98/CC98${code}.${extension}`;
    },
  },
  tb: {
    tagPrefix: "tb",
    label: "贴吧",
    codes: codeRange(1, 33, 2),
    src: (code) => `${ASSET_BASE}/tb/tb${code}.png`,
  },
  "mahjong-animal": {
    tagPrefix: "a:",
    label: "麻将脸 动物",
    codes: codeRange(1, 16, 3),
    src: (code) => `${ASSET_BASE}/mahjong/animal2017/${code}.png`,
  },
  "mahjong-cartoon": {
    tagPrefix: "c:",
    label: "麻将脸 卡通",
    codes: [3, 18, 19, 46, 49, 59, 96, 134, 189, 217].map((value) =>
      String(value).padStart(3, "0"),
    ),
    src: (code) =>
      `${ASSET_BASE}/mahjong/carton2017/${code}.${CARTOON_GIFS.has(Number(code)) ? "gif" : "png"}`,
  },
  "mahjong-face": {
    tagPrefix: "f:",
    label: "麻将脸",
    codes: codeRange(1, 208, 3),
    src: (code) =>
      `${ASSET_BASE}/mahjong/face2017/${code}.${FACE_GIFS.has(Number(code)) ? "gif" : "png"}`,
  },
};

interface EmotionIndex {
  byTag: Map<string, UbbEmotionDescriptor>;
  byFamily: Map<UbbEmotionFamily, UbbEmotionDescriptor[]>;
}

let cachedIndex: EmotionIndex | null = null;

/** 表情表体积固定（599 项），首次解析或枚举时构建，避免仅导入模块就分配。 */
function emotionIndex(): EmotionIndex {
  if (cachedIndex) return cachedIndex;
  const byTag = new Map<string, UbbEmotionDescriptor>();
  const byFamily = new Map<UbbEmotionFamily, UbbEmotionDescriptor[]>();
  const specs = Object.entries(FAMILY_SPECS) as [UbbEmotionFamily, EmotionFamilySpec][];
  for (const [family, spec] of specs) {
    const emotions = spec.codes.map((code) => ({
      family,
      code,
      src: spec.src(code),
      alt: `[${family}:${code}]`,
    }));
    byFamily.set(family, emotions);
    for (const emotion of emotions) byTag.set(`${spec.tagPrefix}${emotion.code}`, emotion);
  }
  cachedIndex = { byTag, byFamily };
  return cachedIndex;
}

export function resolveUbbEmotionTag(tag: string): UbbEmotionDescriptor | null {
  return emotionIndex().byTag.get(tag) ?? null;
}

/** 全部表情分类，顺序即 FAMILY_SPECS 的声明顺序，供 UI 枚举 tab 时对齐。 */
export const UBB_EMOTION_FAMILIES = Object.keys(FAMILY_SPECS) as UbbEmotionFamily[];

/** 按分类列出全部表情，顺序即官方面板顺序，供编辑器表情面板枚举。 */
export function listUbbEmotions(family: UbbEmotionFamily): UbbEmotionDescriptor[] {
  return emotionIndex().byFamily.get(family) ?? [];
}

/** 表情的中文展示名（如 `AC娘 01`），UBB→Markdown 的图片 alt 与编辑器面板共用。 */
export function ubbEmotionDisplayName(emotion: UbbEmotionDescriptor): string {
  return `${FAMILY_SPECS[emotion.family].label} ${emotion.code}`;
}
