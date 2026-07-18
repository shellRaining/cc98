<script setup lang="ts">
import { computed } from "vue";
import { useTitle } from "@vueuse/core";
import { useQuery } from "@tanstack/vue-query";
import { boardsQuery } from "../api/queries";
import BoardListGroup from "../components/board/BoardListGroup.vue";
import PageState from "../components/PageState.vue";
import { boardGroupAnchor } from "../lib/board-list";

useTitle("版面列表 - CC98 论坛");

const { data, error, isPending, refetch } = useQuery(boardsQuery);

const boardGroups = computed(() =>
  [...(data.value ?? [])].sort((left, right) => (left.order ?? 0) - (right.order ?? 0)),
);
</script>

<template>
  <PageState v-if="isPending" kind="loading" />
  <PageState
    v-else-if="error"
    kind="error"
    message="版面列表加载失败，请稍后重试。"
    show-retry
    @retry="refetch()"
  />
  <PageState v-else-if="boardGroups.length === 0" kind="empty" message="暂时没有可浏览的版面。" />

  <section v-else class="board-list-page">
    <div class="board-list-page__groups">
      <BoardListGroup v-for="group in boardGroups" :key="group.id ?? group.name" :group="group" />
    </div>

    <nav class="board-list-guide" aria-label="版面分区快速导航">
      <a
        v-for="group in boardGroups"
        :key="group.id ?? group.name"
        :href="`#${boardGroupAnchor(group.id)}`"
      >
        {{ group.name }}
      </a>
    </nav>
  </section>
</template>

<style scoped>
.board-list-page {
  position: relative;
}

.board-list-page__groups {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.board-list-guide {
  position: fixed;
  top: 4.25rem;
  left: calc(50% + 582px);
  z-index: 5;
  display: flex;
  width: 5rem;
  flex-direction: column;
  align-items: stretch;
  border: 1px solid var(--cc98-color-border);
  background: var(--cc98-color-surface);
  font-size: 0.75rem;
  text-align: center;
}

.board-list-guide a,
.board-list-guide a:visited {
  padding: 0.35rem 0.25rem;
  border-bottom: 1px dashed var(--cc98-color-border);
  color: var(--cc98-color-text-muted);
  white-space: nowrap;
}

.board-list-guide a:last-child {
  border-bottom: 0;
}

.board-list-guide a:hover,
.board-list-guide a:focus-visible {
  background: var(--cc98-color-primary);
  color: #fff;
}

@media (max-width: 1180px) {
  .board-list-guide {
    display: none;
  }
}
</style>
