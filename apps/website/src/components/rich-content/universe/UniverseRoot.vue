<script setup lang="ts">
withDefaults(
  defineProps<{
    preserveWhitespace?: boolean;
  }>(),
  {
    preserveWhitespace: true,
  },
);
</script>

<template>
  <div
    class="rich-content break-words text-cc98-text"
    :class="preserveWhitespace ? 'whitespace-pre-wrap' : 'whitespace-normal'"
  >
    <slot />
  </div>
</template>
