import { parsePositiveInt } from "../../lib/route-params.ts";

export type TopicPostMode = "all" | "trace";

export function resolveTopicPostFilter(query: Record<string, unknown>): {
  mode: TopicPostMode;
  targetId?: number;
} {
  const traceId = parsePositiveInt(typeof query.postId === "string" ? query.postId : null);
  if (traceId != null) return { mode: "trace", targetId: traceId };
  return { mode: "all" };
}

export function topicViewQuery(mode: TopicPostMode, targetId?: number) {
  if (mode === "trace" && targetId) return { postId: String(targetId) };
  return {};
}

export function filteredTopicTotalPages(count: number | undefined | null, pageSize = 10) {
  if (count == null || !Number.isFinite(count) || count < 0) return null;
  return Math.max(1, Math.ceil(count / Math.max(1, pageSize)));
}

export function uniquePostUserIds(posts: Array<{ userId?: number | null; isAnonymous?: boolean }>) {
  return [
    ...new Set(
      posts
        .filter((post) => !post.isAnonymous && post.userId != null && post.userId > 0)
        .map((post) => post.userId as number),
    ),
  ];
}
