<script setup lang="ts">
import type { Topic } from "@cc98/api";
import TopicListItem from "./TopicListItem.vue";

defineProps<{
  topics: Topic[];
  pinnedIds?: Set<number>;
}>();
</script>

<template>
  <ul v-if="topics.length" class="divide-y-0">
    <TopicListItem
      v-for="topic in topics"
      :key="topic.id"
      :topic="topic"
      :pinned="topic.id != null && pinnedIds?.has(topic.id)"
    />
  </ul>
  <p v-else class="text-sm text-cc98-text-muted">暂无主题。</p>
</template>
