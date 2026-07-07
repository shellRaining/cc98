<script setup lang="ts">
import { computed } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { globalConfigQuery } from "../api/queries";

const { data: config } = useQuery(globalConfigQuery);

const stats = computed(() => {
  if (!config.value) return null;
  return {
    online: config.value.maxOnlineCount,
    topics: config.value.topicCount,
    posts: config.value.postCount,
    users: config.value.userCount,
  };
});
</script>

<template>
  <footer
    class="border-t border-cc98-border bg-cc98-bg-elevated text-center text-xs text-cc98-text-muted py-4"
  >
    <p v-if="stats" class="space-x-2">
      <span>最高在线 {{ stats.online }}</span>
      <span>·</span>
      <span>主题 {{ stats.topics }}</span>
      <span>·</span>
      <span>帖子 {{ stats.posts }}</span>
      <span>·</span>
      <span>用户 {{ stats.users }}</span>
    </p>
    <p class="mt-1">浙江大学 CC98 论坛 · 复刻版</p>
  </footer>
</template>
