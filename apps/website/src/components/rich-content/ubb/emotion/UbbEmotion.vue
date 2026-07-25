<script setup lang="ts">
import { computed } from "vue";
import type { UbbEmotionDescriptor } from "@cc98/ubb";
import { useThemeStore } from "../../../../stores/theme";
import { resolveEmotionDisplaySource } from "./source";

const props = defineProps<{
  emotion: UbbEmotionDescriptor;
}>();

const theme = useThemeStore();
const displaySource = computed(() =>
  resolveEmotionDisplaySource(props.emotion, theme.effectiveMode),
);

const isDarkAcEmotion = computed(
  () => props.emotion.family === "ac" && theme.effectiveMode === "dark",
);
</script>

<template>
  <img
    :src="displaySource"
    :alt="emotion.alt"
    :title="emotion.alt"
    loading="lazy"
    decoding="async"
    class="ubb-emotion inline-block max-w-full align-middle"
    :class="{ 'ubb-emotion--ac-dark': isDarkAcEmotion }"
  />
</template>

<style scoped>
.ubb-emotion--ac-dark {
  max-width: min(100%, 150px);
}
</style>
