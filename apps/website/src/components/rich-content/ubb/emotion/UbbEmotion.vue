<script setup lang="ts">
import type { UbbEmotionDescriptor } from "@cc98/ubb";

defineProps<{
  emotion: UbbEmotionDescriptor;
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
