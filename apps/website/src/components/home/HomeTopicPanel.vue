<script setup lang="ts">
import type { HomepageTopicItem } from "./model";
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

<style scoped>
.home-panel {
  margin-top: 0.75rem;
  border: 1px solid currentcolor;
  border-top-width: 8px;
  background: var(--cc98-color-surface);
  color: var(--cc98-color-text);
}

.home-panel--primary {
  border-color: var(--cc98-color-primary);
}

.home-panel--secondary {
  border-color: var(--cc98-color-secondary);
}

.home-topic-section {
  min-width: 0;
}

.home-topic-panel {
  height: 20rem;
  padding: 0.75rem 1.25rem 1.25rem;
  font-size: 0.75rem;
  --home-topic-row-count: 10;
}

.home-topic-panel ul {
  height: 100%;
  margin: 0;
  padding: 0;
  list-style: none;
}

.home-topic-panel ul {
  display: grid;
  grid-template-rows: repeat(var(--home-topic-row-count), minmax(0, 1fr));
}

.home-topic-panel li {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.35rem;
}

.home-topic-panel__board {
  flex: none;
  color: var(--cc98-color-primary);
}

.home-topic-panel__title {
  min-width: 0;
  overflow: hidden;
  color: var(--cc98-color-text);
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
