export const DEFAULT_AVATAR_URL = "/static/images/default_avatar_boy.png";

const INSECURE_HTTP_PROTOCOL = /^http:\/\//i;

export function normalizeAvatarUrl(value: string | null | undefined): string | null {
  const url = value?.trim();
  if (!url) return null;
  return url.replace(INSECURE_HTTP_PROTOCOL, "https://");
}

export function resolveAvatarUrl(...candidates: Array<string | null | undefined>): string {
  for (const candidate of candidates) {
    const url = normalizeAvatarUrl(candidate);
    if (url) return url;
  }
  return DEFAULT_AVATAR_URL;
}
