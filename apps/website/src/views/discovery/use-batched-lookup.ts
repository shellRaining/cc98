import { shallowRef, watch, type ComputedRef } from "vue";
import { useQueryClient, type QueryKey } from "@tanstack/vue-query";

export function useBatchedLookup<T extends { id: number }>(
  ids: ComputedRef<number[]>,
  rootKey: QueryKey,
  fetchBatch: (ids: number[]) => Promise<T[]>,
) {
  const queryClient = useQueryClient();
  const cached = queryClient.getQueriesData<T[]>({ queryKey: rootKey });
  const records = shallowRef(
    new Map(cached.flatMap(([, data]) => data ?? []).map((item) => [item.id, item])),
  );
  const resolved = new Set(records.value.keys());
  const inFlight = new Set<number>();
  const error = shallowRef<unknown>(null);

  async function load() {
    const missing = ids.value.filter((id) => id > 0 && !resolved.has(id) && !inFlight.has(id));
    if (missing.length === 0) return;
    missing.forEach((id) => inFlight.add(id));
    error.value = null;
    try {
      const items = await fetchBatch(missing);
      records.value = new Map([...records.value, ...items.map((item) => [item.id, item] as const)]);
      missing.forEach((id) => resolved.add(id));
    } catch (cause) {
      error.value = cause;
    } finally {
      missing.forEach((id) => inFlight.delete(id));
    }
  }

  watch(ids, () => void load(), { immediate: true });
  return { records, error, retry: load };
}
