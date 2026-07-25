<script setup lang="ts">
defineProps<{
  code: string;
  language?: string;
}>();
</script>

<template>
  <pre
    class="my-3 overflow-x-auto rounded bg-cc98-inverse-surface p-4 text-sm text-cc98-inverse-text"
  ><code
    :class="language ? `language-${language}` : undefined"
  >{{ code }}</code></pre>
</template>
