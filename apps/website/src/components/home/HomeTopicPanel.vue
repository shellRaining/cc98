<script setup lang="ts">
import type { HomepageTopicItem } from "../../lib/home";
import HomeSectionHeader from "./HomeSectionHeader.vue";

withDefaults(
  defineProps<{
    title: string;
    items: HomepageTopicItem[];
    tone?: "primary" | "secondary";
    showBoard?: boolean;
  }>(),
  { tone: "primary", showBoard: false },
);
</script>

<template>
  <section v-if="items.length" class="home-topic-section">
    <HomeSectionHeader :title="title" :tone="tone">
      <slot name="actions" />
    </HomeSectionHeader>
    <div class="home-panel home-topic-panel" :class="`home-panel--${tone}`">
      <ul>
        <li v-for="item in items" :key="item.id">
          <RouterLink
            v-if="showBoard && item.boardId && item.boardName"
            :to="`/list/${item.boardId}`"
            class="home-topic-panel__board"
          >
            [{{ item.boardName }}]
          </RouterLink>
          <RouterLink :to="`/topic/${item.id}`" class="home-topic-panel__title" :title="item.title">
            {{ item.title }}
          </RouterLink>
        </li>
      </ul>
    </div>
  </section>
</template>
