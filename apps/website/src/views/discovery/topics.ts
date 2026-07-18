export function uniqueTopicBoardIds(topics: Array<{ boardId?: number }>) {
  return [...new Set(topics.flatMap((topic) => (topic.boardId ? [topic.boardId] : [])))];
}

export function uniqueTopicUserIds(
  topics: Array<{ userId?: number | null; isAnonymous?: boolean }>,
) {
  return [
    ...new Set(
      topics.flatMap((topic) =>
        !topic.isAnonymous && topic.userId != null && topic.userId > 0 ? [topic.userId] : [],
      ),
    ),
  ];
}

/** 按主题 ID 去重，保留首次出现顺序。 */
export function dedupeTopicsById<T extends { id?: number }>(topics: T[]): T[] {
  const seen = new Set<number>();
  const result: T[] = [];
  for (const topic of topics) {
    if (topic.id == null) {
      result.push(topic);
      continue;
    }
    if (seen.has(topic.id)) continue;
    seen.add(topic.id);
    result.push(topic);
  }
  return result;
}
