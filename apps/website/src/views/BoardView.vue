<script setup lang="ts">
defineProps<{
  boardId: string;
  type?: string;
  page?: string;
}>();
</script>

<template>
  <section class="space-y-4">
    <h1 class="text-2xl font-bold">版面主题列表</h1>
    <p class="text-cc98-text-muted">boardId: {{ boardId }} · page: {{ page ?? 1 }}</p>
    <p class="text-sm text-cc98-text-muted">主题列表（Pager + vue-virtual-scroller）待实现。</p>
  </section>
</template>
