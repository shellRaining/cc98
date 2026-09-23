export interface UbbEmotionDescriptor {
  family:
    | "em"
    | "ac"
    | "ms"
    | "cc98"
    | "tb"
    | "mahjong-animal"
    | "mahjong-cartoon"
    | "mahjong-face";
  code: string;
  src: string;
  alt: string;
}

const CARTOON_CODES = new Set([3, 18, 19, 46, 49, 59, 96, 134, 189, 217]);
const CARTOON_GIFS = new Set([18, 49, 96]);
const FACE_GIFS = new Set([4, 9, 56, 61, 62, 87, 115, 120, 137, 168, 169, 175, 206]);
const EMOTION_ASSET_BASE = "https://www.cc98.org/static/images";

function descriptor(
  family: UbbEmotionDescriptor["family"],
  code: string,
  src: string,
): UbbEmotionDescriptor {
  return { family, code, src, alt: `[${family}:${code}]` };
}

export function resolveUbbEmotionTag(tag: string): UbbEmotionDescriptor | null {
  let match = tag.match(/^em(\d{2})$/);
  if (match) {
    const value = Number(match[1]);
    return value <= 91
      ? descriptor("em", match[1], `${EMOTION_ASSET_BASE}/em/em${match[1]}.gif`)
      : null;
  }

  match = tag.match(/^ac(\d{2}|\d{4})$/);
  if (match) {
    const value = Number(match[1]);
    const valid =
      (value >= 1 && value <= 54) ||
      (value >= 1001 && value <= 1040) ||
      (value >= 2001 && value <= 2055);
    return valid ? descriptor("ac", match[1], `${EMOTION_ASSET_BASE}/ac/${match[1]}.png`) : null;
  }

  match = tag.match(/^ms(\d{2})$/);
  if (match) {
    const value = Number(match[1]);
    return value >= 1 && value <= 54
      ? descriptor("ms", match[1], `${EMOTION_ASSET_BASE}/ms/ms${match[1]}.png`)
      : null;
  }

  match = tag.match(/^cc98(\d{2})$/);
  if (match) {
    const value = Number(match[1]);
    if (value < 1 || value > 37) return null;
    const extension = (value >= 15 && value <= 30) || value >= 36 ? "png" : "gif";
    return descriptor("cc98", match[1], `${EMOTION_ASSET_BASE}/CC98/CC98${match[1]}.${extension}`);
  }

  match = tag.match(/^tb(\d{2})$/);
  if (match) {
    const value = Number(match[1]);
    return value >= 1 && value <= 33
      ? descriptor("tb", match[1], `${EMOTION_ASSET_BASE}/tb/tb${match[1]}.png`)
      : null;
  }

  match = tag.match(/^([acf]):(\d{3})$/);
  if (!match) return null;
  const type = match[1];
  const code = match[2];
  const value = Number(code);
  if (type === "a" && value >= 1 && value <= 16) {
    return descriptor(
      "mahjong-animal",
      code,
      `${EMOTION_ASSET_BASE}/mahjong/animal2017/${code}.png`,
    );
  }
  if (type === "c" && CARTOON_CODES.has(value)) {
    const extension = CARTOON_GIFS.has(value) ? "gif" : "png";
    return descriptor(
      "mahjong-cartoon",
      code,
      `${EMOTION_ASSET_BASE}/mahjong/carton2017/${code}.${extension}`,
    );
  }
  if (type === "f" && value >= 1 && value <= 208) {
    const extension = FACE_GIFS.has(value) ? "gif" : "png";
    return descriptor(
      "mahjong-face",
      code,
      `${EMOTION_ASSET_BASE}/mahjong/face2017/${code}.${extension}`,
    );
  }
  return null;
}
