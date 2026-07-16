import type { IndexColumn } from "@cc98/api";

export interface HomepageTopicItem {
  id: number;
  title: string;
  boardId?: number;
  boardName?: string;
}

const HTTP_URL = /^http:\/\//i;

export function normalizeHomepageAssetUrl(value: string | null | undefined): string | null {
  const url = value?.trim();
  if (!url) return null;
  return url.replace(HTTP_URL, "https://");
}

export function visibleHomepageColumns(
  items: readonly IndexColumn[] | null | undefined,
  now = new Date(),
): IndexColumn[] {
  const timestamp = now.getTime();
  return (items ?? [])
    .filter((item) => {
      if (item.enable === false) return false;
      if (!item.expiredTime) return true;
      const expiredAt = new Date(item.expiredTime).getTime();
      return Number.isNaN(expiredAt) || expiredAt > timestamp;
    })
    .sort((left, right) => (right.orderWeight ?? 0) - (left.orderWeight ?? 0));
}

export function isExternalHomepageUrl(value: string | null | undefined): boolean {
  return /^https?:\/\//i.test(value?.trim() ?? "");
}

export function normalizeHomepageTopic(topic: {
  id?: number;
  title?: string;
  boardId?: number;
  boardName?: string;
}): HomepageTopicItem | null {
  if (!topic.id) return null;
  return {
    id: topic.id,
    title: topic.title?.trim() || "（无标题）",
    boardId: topic.boardId,
    boardName: topic.boardName?.trim() || undefined,
  };
}
