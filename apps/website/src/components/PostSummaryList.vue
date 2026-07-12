<script setup lang="ts">
import type { Post } from "@cc98/api";
import PostSummaryListItem from "./PostSummaryListItem.vue";

defineProps<{
  posts: Post[];
  boardNames: Map<number, string>;
}>();
</script>

<template>
  <ul v-if="posts.length" class="m-0 list-none divide-y divide-cc98-border p-0">
    <PostSummaryListItem
      v-for="post in posts"
      :key="post.id"
      :post="post"
      :board-name="post.boardId == null ? undefined : boardNames.get(post.boardId)"
    />
  </ul>
  <p v-else class="text-sm text-cc98-text-muted">暂无回复。</p>
</template>
