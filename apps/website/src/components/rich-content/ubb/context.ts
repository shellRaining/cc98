import type { RichContentOptions } from "../types";

interface UbbRenderState {
  imageCount: number;
}

export interface UbbRenderContext {
  options: Readonly<RichContentOptions>;
  state: UbbRenderState;
}

export function createUbbRenderContext(options: Readonly<RichContentOptions>): UbbRenderContext {
  return {
    options,
    state: {
      imageCount: 0,
    },
  };
}
