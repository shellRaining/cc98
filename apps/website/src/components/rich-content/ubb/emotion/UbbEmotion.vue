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
    class="mx-0.5 inline-block max-h-12 max-w-24 align-middle"
  />
</template>
