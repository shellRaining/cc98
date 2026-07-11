import type { RichContentOptions } from "./types";

export const defaultRichContentOptions: Readonly<RichContentOptions> = Object.freeze({
  allowExternalUrl: true,
  allowImage: true,
  allowExternalImage: true,
  allowMediaContent: true,
  allowEmotion: true,
  allowEmbeddedMarkdown: true,
  allowToolbox: false,
  maxImageCount: 100,
});

export function resolveRichContentOptions(
  options?: Partial<RichContentOptions>,
): Readonly<RichContentOptions> {
  const maxImageCount = Math.max(
    0,
    Math.floor(options?.maxImageCount ?? defaultRichContentOptions.maxImageCount),
  );

  return Object.freeze({
    ...defaultRichContentOptions,
    ...options,
    maxImageCount,
  });
}
