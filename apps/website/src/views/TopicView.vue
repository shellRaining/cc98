<script setup lang="ts">
defineProps<{
  topicId: string;
  page?: string;
}>();
</script>

<template>
  <section class="space-y-4">
    <h1 class="text-2xl font-bold">帖子详情</h1>
    <p class="text-cc98-text-muted">topicId: {{ topicId }} · page: {{ page ?? 1 }}</p>
    <p class="text-sm text-cc98-text-muted">
      楼层列表（vue-virtual-scroller）+ Markdown/UBB 渲染待实现。
    </p>
  </section>
</template>
