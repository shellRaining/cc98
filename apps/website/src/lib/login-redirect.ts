const REDIRECT_KEY = "logOnRedirectUrl";

/** 只接受站内绝对路径，拒绝协议相对与外链。 */
export function isSafeInternalPath(path: string): boolean {
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//")) return false;
  if (path.includes("://")) return false;
  return true;
}

export function saveLoginRedirect(path: string): void {
  if (!isSafeInternalPath(path)) return;
  try {
    localStorage.setItem(REDIRECT_KEY, path);
  } catch {
    // 存储不可用时忽略
  }
}

export function takeLoginRedirect(fallback = "/"): string {
  try {
    const raw = localStorage.getItem(REDIRECT_KEY);
    localStorage.removeItem(REDIRECT_KEY);
    if (raw && isSafeInternalPath(raw)) return raw;
  } catch {
    // 存储不可用时忽略
  }
  return fallback;
}
