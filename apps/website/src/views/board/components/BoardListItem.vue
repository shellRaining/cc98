<script setup lang="ts">
import type { Board } from "@cc98/api";
import BoardIcon from "../../../components/board/BoardIcon.vue";

defineProps<{
  board: Board;
  compact?: boolean;
}>();
</script>

<template>
  <RouterLink
    v-if="board.id != null"
    :to="`/list/${board.id}`"
    class="board-list-item"
    :class="{ 'board-list-item--compact': compact }"
    :title="board.description || board.name"
  >
    <template v-if="!compact">
      <span class="board-list-item__icon" aria-hidden="true">
        <BoardIcon class="board-list-item__image" :name="board.name" />
      </span>
      <span class="board-list-item__body">
        <strong class="board-list-item__name">{{ board.name }}</strong>
        <span class="board-list-item__stats">
          <span>今日 {{ board.todayCount ?? 0 }}</span>
          <span>总数 {{ board.postCount ?? 0 }}</span>
        </span>
      </span>
    </template>
    <template v-else>{{ board.name }}</template>
  </RouterLink>
</template>

<style scoped>
.board-list-item,
.board-list-item:visited {
  color: var(--cc98-color-text);
}

.board-list-item {
  display: flex;
  min-width: 0;
  min-height: 8.25rem;
  align-items: center;
  gap: 0.5rem;
  padding: 1.1rem;
}

.board-list-item:hover .board-list-item__name {
  color: var(--cc98-color-primary-hover);
  text-decoration: underline;
}

.board-list-item__icon {
  display: grid;
  width: 6rem;
  height: 6rem;
  flex: none;
  overflow: hidden;
  border-radius: 50%;
  background: var(--cc98-color-primary);
  place-items: center;
}

.board-list-item__image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.board-list-item__body,
.board-list-item__stats {
  display: flex;
  flex-direction: column;
}

.board-list-item__body {
  min-width: 0;
  gap: 0.5rem;
}

.board-list-item__name {
  overflow: hidden;
  font-size: 0.875rem;
  letter-spacing: 0.08em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.board-list-item__stats {
  gap: 0.15rem;
  color: var(--cc98-color-text);
  font-size: 0.75rem;
  line-height: 1.35;
}

.board-list-item--compact {
  min-height: 2rem;
  padding: 0.35rem 0;
  overflow: hidden;
  font-size: 0.75rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.board-list-item--compact:hover {
  color: var(--cc98-color-primary-hover);
  text-decoration: underline;
}
</style>
