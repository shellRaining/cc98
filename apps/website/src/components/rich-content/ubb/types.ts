import type { UbbTagHandler } from "@cc98/ubb";
import type { VNodeChild } from "vue";
import type { UbbRenderContext } from "./context";

/** 网站 UBB Vue renderer 的输出是 VNodeChild 数组，上下文是 UbbRenderContext。 */
export type UbbTagRenderer = UbbTagHandler<VNodeChild[], UbbRenderContext>;
