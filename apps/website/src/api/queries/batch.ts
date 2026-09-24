import type { QueryClient } from "@tanstack/vue-query";

export async function fetchMissingByIds<T extends { id?: number }>(
  client: QueryClient,
  queryKey: readonly unknown[],
  ids: number[],
  fetchBatch: (ids: number[]) => Promise<T[]>,
): Promise<T[]> {
  const cached = new Map<number, T>();
  const now = Date.now();
  for (const query of client.getQueryCache().findAll({ queryKey })) {
    if (
      query.state.isInvalidated ||
      now - query.state.dataUpdatedAt >= 5 * 60 * 1000 ||
      !Array.isArray(query.state.data)
    ) {
      continue;
    }
    for (const item of query.state.data as T[]) {
      if (item.id != null) cached.set(item.id, item);
    }
  }

  const missing = ids.filter((id) => !cached.has(id));
  for (let start = 0; start < missing.length; start += 30) {
    const batch = await fetchBatch(missing.slice(start, start + 30));
    for (const item of batch) {
      if (item.id != null) cached.set(item.id, item);
    }
  }
  return ids.flatMap((id) => {
    const item = cached.get(id);
    return item ? [item] : [];
  });
}
