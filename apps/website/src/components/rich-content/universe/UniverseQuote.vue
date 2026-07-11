<script setup lang="ts">
defineProps<{
  source?: string;
}>();
</script>

<template>
  <blockquote class="my-3 border-l-4 border-cc98-border bg-cc98-bg-elevated px-4 py-3">
    <cite v-if="source" class="mb-2 block text-sm not-italic text-cc98-text-muted">
      {{ source }}：
    </cite>
    <slot />
  </blockquote>
</template>
