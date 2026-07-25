<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { UbbEmotionDescriptor } from "@cc98/ubb";
import { useThemeStore } from "../../../../stores/theme";
import { resolveEmotionDisplaySource } from "./source";

const props = defineProps<{
  emotion: UbbEmotionDescriptor;
}>();

const theme = useThemeStore();
const preferredSource = computed(() =>
  resolveEmotionDisplaySource(props.emotion, theme.effectiveMode),
);
const displaySource = ref(preferredSource.value);

watch(preferredSource, (source) => {
  displaySource.value = source;
});

const isDarkAcEmotion = computed(
  () => props.emotion.family === "ac" && theme.effectiveMode === "dark",
);
const usesLightFallback = computed(
  () => isDarkAcEmotion.value && displaySource.value === props.emotion.src,
);

function handleLoadError() {
  if (displaySource.value !== props.emotion.src) {
    displaySource.value = props.emotion.src;
  }
}
</script>

<template>
  <img
    :src="displaySource"
    :alt="emotion.alt"
    :title="emotion.alt"
    loading="lazy"
    decoding="async"
    class="ubb-emotion inline-block max-w-full align-middle"
    :class="{
      'ubb-emotion--ac-dark': isDarkAcEmotion,
      'ubb-emotion--light-fallback': usesLightFallback,
    }"
    @error="handleLoadError"
  />
</template>

<style scoped>
.ubb-emotion--ac-dark {
  max-width: min(100%, 150px);
}

.ubb-emotion--light-fallback {
  filter: drop-shadow(0 0 1px rgb(255 255 255 / 70%));
}
</style>
