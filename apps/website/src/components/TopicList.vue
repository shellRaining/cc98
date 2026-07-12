<script setup lang="ts">
import type { Topic } from "@cc98/api";
import TopicListItem from "./TopicListItem.vue";

withDefaults(
  defineProps<{
    topics: Topic[];
    pinnedIds?: Set<number>;
    showBoard?: boolean;
  }>(),
  {
    showBoard: true,
  },
);
</script>

<template>
  <ul v-if="topics.length" class="m-0 list-none divide-y-0 p-0">
    <TopicListItem
      v-for="topic in topics"
      :key="topic.id"
      :topic="topic"
      :pinned="topic.id != null && pinnedIds?.has(topic.id)"
      :show-board="showBoard"
    >
      <slot name="item" :topic="topic" />
    </TopicListItem>
  </ul>
  <p v-else class="text-sm text-cc98-text-muted">暂无主题。</p>
</template>
