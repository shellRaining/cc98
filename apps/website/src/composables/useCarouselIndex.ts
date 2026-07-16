import { useIntervalFn } from "@vueuse/core";
import { computed, ref, toValue, watch, type MaybeRefOrGetter } from "vue";

export function useCarouselIndex(length: MaybeRefOrGetter<number>, interval = 20_000) {
  const index = ref(0);
  const pausedByUser = ref(false);

  const count = computed(() => Math.max(0, toValue(length)));
  watch(count, (next) => {
    if (next === 0) index.value = 0;
    else if (index.value >= next) index.value = next - 1;
  });

  const { pause, resume } = useIntervalFn(
    () => {
      if (count.value > 1) index.value = (index.value + 1) % count.value;
    },
    interval,
    { immediate: true },
  );

  function select(next: number) {
    if (next >= 0 && next < count.value) index.value = next;
  }

  function setPaused(paused: boolean) {
    pausedByUser.value = paused;
    if (paused) pause();
    else resume();
  }

  return { index, pausedByUser, select, setPaused };
}
