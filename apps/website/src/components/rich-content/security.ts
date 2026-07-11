import type { RichContentOptions } from "./types";

const ABSOLUTE_PROTOCOL = /^[a-z][a-z\d+.-]*:/i;

function isRelativeUrl(value: string): boolean {
  // `//host/path` 会继承当前协议并访问外部站点，不能按站内绝对路径放行。
  return (
    (value.startsWith("/") && !value.startsWith("//")) ||
    value.startsWith("./") ||
    value.startsWith("../")
  );
}

function parseHttpUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

/**
 * 过滤富内容中的普通链接。
 *
 * 站内相对地址、页内锚点和邮件链接不受外链开关影响；外部地址仅允许 HTTP(S)，
 * 避免 `javascript:`、`data:` 等协议进入 href。
 */
export function sanitizeLinkUrl(
  source: string,
  options: Readonly<RichContentOptions>,
): string | null {
  const value = source.trim();
  if (!value) return null;
  if (isRelativeUrl(value) || value.startsWith("#")) return value;
  if (/^mailto:/i.test(value)) return value;
  if (!options.allowExternalUrl) return null;
  return parseHttpUrl(value) ? value : null;
}

/**
 * 过滤图片地址。图片有独立于普通链接的展示与外链开关，避免打开链接权限时
 * 同时允许帖子静默加载第三方图片资源。
 */
export function sanitizeImageUrl(
  source: string,
  options: Readonly<RichContentOptions>,
): string | null {
  const value = source.trim();
  if (!value || !options.allowImage) return null;
  if (isRelativeUrl(value)) return value;
  if (!options.allowExternalImage) return null;
  return parseHttpUrl(value) ? value : null;
}

/**
 * 过滤音视频地址。媒体复用普通外链权限，但要求外部输入显式携带协议，
 * 防止把形似域名的文本补全为远程媒体地址。
 */
export function sanitizeMediaUrl(
  source: string,
  options: Readonly<RichContentOptions>,
): string | null {
  const value = source.trim();
  if (!value || !options.allowMediaContent) return null;
  if (isRelativeUrl(value)) return value;
  if (!options.allowExternalUrl || !ABSOLUTE_PROTOCOL.test(value)) return null;
  return parseHttpUrl(value) ? value : null;
}
