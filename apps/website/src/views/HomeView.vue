<script setup lang="ts">
import { computed } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { boardsQuery, globalConfigQuery, hotTopicsQuery } from "../api/queries";
import ContentRenderer from "../components/rich-content/ContentRenderer.vue";
import { hotTopicsPath } from "../lib/discovery";

const { data: config } = useQuery(globalConfigQuery);
const { data: boardGroups } = useQuery(boardsQuery);

const announcementLines = computed(() =>
  (config.value?.announcement ?? "").split("\n").filter(Boolean),
);

const { data: monthlyHot } = useQuery({
  ...hotTopicsQuery("monthly"),
  select: (topics) => topics.slice(0, 10),
});

const totalBoards = computed(() =>
  (boardGroups.value ?? []).reduce((acc, group) => acc + group.boards.length, 0),
);
</script>

<template>
  <section class="space-y-8">
    <div>
      <h1 class="text-3xl font-bold mb-2">CC98 论坛</h1>
      <p class="text-cc98-text-muted">浙江大学学生论坛 · 复刻版（Vue 3.6 + vite-plus）</p>
    </div>

    <div v-if="config" class="cc98-card p-4">
      <h2 class="text-lg font-semibold mb-2">站点公告</h2>
      <ul class="text-sm space-y-1">
        <li v-for="(line, idx) in announcementLines" :key="idx" class="text-cc98-text-muted">
          <ContentRenderer :content="line" type="ubb" />
        </li>
      </ul>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="cc98-card p-4">
        <div class="mb-3 flex items-baseline justify-between gap-3">
          <h2 class="text-lg font-semibold">本月热门</h2>
          <RouterLink :to="hotTopicsPath('monthly')" class="cc98-link text-sm">查看全部</RouterLink>
        </div>
        <ol v-if="monthlyHot?.length" class="list-none space-y-2 text-sm">
          <li v-for="(topic, idx) in monthlyHot" :key="topic.id">
            <span class="text-cc98-text-muted mr-2">{{ idx + 1 }}.</span>
            <RouterLink :to="`/topic/${topic.id}`" class="cc98-link">
              {{ topic.title }}
            </RouterLink>
          </li>
        </ol>
        <p v-else class="text-sm text-cc98-text-muted">加载中…</p>
      </div>

      <div class="cc98-card p-4">
        <h2 class="text-lg font-semibold mb-3">版面导航</h2>
        <p v-if="boardGroups" class="text-sm text-cc98-text-muted mb-2">
          共 {{ boardGroups.length }} 个分组 · {{ totalBoards }} 个版面
        </p>
        <ul v-if="boardGroups" class="text-sm space-y-1">
          <li v-for="group in boardGroups.slice(0, 6)" :key="group.id">
            <RouterLink to="/boardlist" class="cc98-link">
              {{ group.name }}
            </RouterLink>
            <span class="text-cc98-text-muted ml-1">({{ group.boards.length }})</span>
          </li>
        </ul>
        <p v-else class="text-sm text-cc98-text-muted">加载中…</p>
      </div>
    </div>
  </section>
</template>
