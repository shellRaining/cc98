import { h, type VNodeChild } from "vue";
import { sanitizeImageUrl, sanitizeLinkUrl, sanitizeMediaUrl } from "../security";
import type { UbbRenderContext } from "./context";
import UniverseAudio from "../universe/UniverseAudio.vue";
import UniverseBili from "../universe/UniverseBili.vue";
import UniverseImage from "../universe/UniverseImage.vue";
import UniverseMath from "../universe/UniverseMath.vue";
import UniverseUpload from "../universe/UniverseUpload.vue";
import UniverseVideo from "../universe/UniverseVideo.vue";
import type { UbbTagRenderer } from "./types";

const IMAGE_UPLOAD_TYPES = new Set(["jpg", "jpeg", "png", "gif", "bmp", "webp"]);

function renderImage(
  source: string,
  title: string | undefined,
  hidden: boolean,
  context: UbbRenderContext,
): VNodeChild[] {
  const safeSrc = sanitizeImageUrl(source, context.options);
  if (!safeSrc || context.state.imageCount >= context.options.maxImageCount) return [source];
  context.state.imageCount += 1;
  return [
    h(UniverseImage, {
      src: safeSrc,
      alt: title ?? "",
      title,
      defaultVisible: !hidden,
      allowToolbox: context.options.allowToolbox,
      showCaption: Boolean(title),
    }),
  ];
}

export const renderImageTag: UbbTagRenderer = ({ attrs, text, context }) => {
  const source = text.trim();
  return renderImage(source, attrs.named.title || undefined, attrs.positionals[0] === "1", context);
};

export const renderUploadTag: UbbTagRenderer = ({ attrs, text, context }) => {
  const source = text.trim();
  const type = attrs.positionals[0]?.toLowerCase();
  if (type && IMAGE_UPLOAD_TYPES.has(type)) {
    return renderImage(source, "上传图片", attrs.positionals[1] === "1", context);
  }

  const href = sanitizeLinkUrl(source, context.options);
  return href ? [h(UniverseUpload, { href })] : [source];
};

export const renderMediaTag: UbbTagRenderer = ({ node, attrs, text, context }) => {
  const source = text.trim();
  const url = sanitizeMediaUrl(source, context.options);
  if (!url) return [source];
  if (node.tag === "audio" || node.tag === "mp3") {
    return [h(UniverseAudio, { url, title: attrs.named.title || undefined })];
  }
  return [h(UniverseVideo, { url })];
};

interface BiliDescriptor {
  aid?: string;
  bvid?: string;
  page: number;
}

function resolveBiliSource(source: string, requestedPage?: string): BiliDescriptor | null {
  const value = source.trim();
  const fallbackPage = Math.max(1, Number.parseInt(requestedPage ?? "1", 10) || 1);
  if (/^\d+$/.test(value)) return { aid: value, page: fallbackPage };
  if (/^BV[A-Za-z0-9]+$/.test(value)) return { bvid: value, page: fallbackPage };

  try {
    const normalized = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    const url = new URL(normalized);
    if (!/(^|\.)bilibili\.com$/i.test(url.hostname)) return null;
    const match = url.pathname.match(/^\/video\/(av\d+|BV[A-Za-z0-9]+)/i);
    if (!match) return null;
    const page = Math.max(1, Number.parseInt(url.searchParams.get("p") ?? "1", 10) || 1);
    return match[1].toLowerCase().startsWith("av")
      ? { aid: match[1].slice(2), page }
      : { bvid: match[1], page };
  } catch {
    return null;
  }
}

export const renderBiliTag: UbbTagRenderer = ({ attrs, text, context }) => {
  const source = text.trim();
  if (!context.options.allowMediaContent) return [source];
  const descriptor = resolveBiliSource(source, attrs.positionals[0]);
  return descriptor ? [h(UniverseBili, descriptor)] : [source];
};

export const renderMathTag: UbbTagRenderer = ({ node, text }) => {
  return [h(UniverseMath, { content: text, inline: node.tag === "m" })];
};
