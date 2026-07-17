<script setup lang="ts">
withDefaults(
  defineProps<{
    contentType?: "ubb" | "markdown";
    preserveWhitespace?: boolean;
  }>(),
  {
    contentType: "ubb",
    preserveWhitespace: true,
  },
);
</script>

<template>
  <div
    class="rich-content break-words text-cc98-text"
    :class="[
      `rich-content--${contentType}`,
      preserveWhitespace ? 'whitespace-pre-wrap' : 'whitespace-normal',
    ]"
  >
    <slot />
  </div>
</template>
