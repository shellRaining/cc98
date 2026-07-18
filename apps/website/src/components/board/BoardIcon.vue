<script setup lang="ts">
import { computed } from "vue";
import { BOARD_ICON_FALLBACK, boardIconUrl } from "./board-icon";

const props = withDefaults(
  defineProps<{
    name?: string;
    src?: string | null;
    alt?: string;
  }>(),
  {
    name: undefined,
    src: undefined,
    alt: "",
  },
);

const iconUrl = computed(() => props.src || boardIconUrl(props.name));

function useFallbackIcon(event: Event) {
  const image = event.currentTarget as HTMLImageElement;
  if (!image.src.endsWith(BOARD_ICON_FALLBACK)) image.src = BOARD_ICON_FALLBACK;
}
</script>

<template>
  <img :src="iconUrl" :alt="alt" @error="useFallbackIcon" />
</template>
