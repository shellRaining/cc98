<script setup lang="ts">
import type { EmotionDescriptor } from "./resolveEmotionTag";

defineProps<{
  emotion: EmotionDescriptor;
}>();
</script>

<template>
  <img
    :src="emotion.src"
    :alt="emotion.alt"
    :title="emotion.alt"
    loading="lazy"
    class="inline-block max-w-full align-middle"
  />
</template>
