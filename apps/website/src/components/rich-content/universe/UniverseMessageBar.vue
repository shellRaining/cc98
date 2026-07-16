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
        ? 'border-cc98-warning bg-cc98-warning/10 text-cc98-text'
        : 'border-cc98-border bg-cc98-surface text-cc98-text'
    "
  >
    {{ message }}
  </aside>
</template>
