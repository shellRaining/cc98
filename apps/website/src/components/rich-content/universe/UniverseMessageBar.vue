<script setup lang="ts">
withDefaults(
  defineProps<{
    message: string;
    tone?: "info" | "warning";
  }>(),
  {
    tone: "info",
  },
);
</script>

<template>
  <aside
    class="my-3 rounded border px-4 py-3 text-sm"
    :class="
      tone === 'warning'
        ? 'border-amber-400 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100'
        : 'border-cc98-border bg-cc98-bg-elevated text-cc98-text'
    "
  >
    {{ message }}
  </aside>
</template>
