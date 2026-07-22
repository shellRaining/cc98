import deletedUserAvatarUrl from "../../assets/brand/cc98.png";
import anonymousPostAvatarUrl from "../../assets/user/anonymous/post.gif";
import anonymousTopicAvatarUrl from "../../assets/user/anonymous/topic.png";

export const DEFAULT_AVATAR_URL = "/static/images/default_avatar_boy.png";
export const ANONYMOUS_POST_AVATAR_URL = anonymousPostAvatarUrl;
export const ANONYMOUS_TOPIC_AVATAR_URL = anonymousTopicAvatarUrl;
export const DELETED_USER_AVATAR_URL = deletedUserAvatarUrl;

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
