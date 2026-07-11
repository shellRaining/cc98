<script setup lang="ts">
defineProps<{
  code: string;
  language?: string;
}>();
</script>

<template>
  <pre class="my-3 overflow-x-auto rounded bg-black/90 p-4 text-sm text-white"><code
    :class="language ? `language-${language}` : undefined"
  >{{ code }}</code></pre>
</template>
