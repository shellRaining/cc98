import type { UbbEmotionDescriptor } from "@cc98/ubb";
import type { ThemeMode } from "../../../../stores/skins";

const AC_SOURCE_SEGMENT = "/ac/";
const AC_DARK_SOURCE_SEGMENT = "/ac-dark/";

export function resolveEmotionDisplaySource(
  emotion: UbbEmotionDescriptor,
  mode: ThemeMode,
): string {
  if (emotion.family !== "ac" || mode !== "dark") return emotion.src;
  return emotion.src.replace(AC_SOURCE_SEGMENT, AC_DARK_SOURCE_SEGMENT);
}
