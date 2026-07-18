<script setup lang="ts">
import { ref } from "vue";
import type { BoardGroup } from "@cc98/api";
import { boardGroupAnchor, isCompactBoardGroup } from "../list";
import BoardListItem from "./BoardListItem.vue";

const props = defineProps<{
  group: BoardGroup;
}>();

const expanded = ref(true);
const compact = isCompactBoardGroup(props.group.id);
</script>

<template>
  <section :id="boardGroupAnchor(group.id)" class="board-list-group">
    <header class="board-list-group__header">
      <div class="board-list-group__heading">
        <h2>{{ group.name }}</h2>
        <div v-if="group.masters?.length" class="board-list-group__masters">
          <span>主管：</span>
          <RouterLink
            v-for="master in group.masters"
            :key="master"
            :to="`/user/name/${encodeURIComponent(master)}`"
          >
            {{ master }}
          </RouterLink>
        </div>
      </div>
      <button
        type="button"
        class="board-list-group__toggle"
        :aria-expanded="expanded"
        :aria-controls="`board-group-content-${group.id ?? 'unknown'}`"
        @click="expanded = !expanded"
      >
        {{ expanded ? "收起" : "展开" }}
      </button>
    </header>

    <div
      v-show="expanded"
      :id="`board-group-content-${group.id ?? 'unknown'}`"
      class="board-list-group__content"
      :class="{ 'board-list-group__content--compact': compact }"
    >
      <BoardListItem
        v-for="board in group.boards ?? []"
        :key="board.id ?? board.name"
        :board="board"
        :compact="compact"
      />
    </div>
  </section>
</template>

<style scoped>
.board-list-group {
  scroll-margin-top: 1rem;
  border: 2px solid var(--cc98-color-border);
  background: var(--cc98-color-surface);
}

.board-list-group__header {
  display: flex;
  min-height: 3rem;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.5rem 1rem 0.5rem 1.1rem;
  background: var(--cc98-color-primary);
  color: #fff;
}

.board-list-group__heading,
.board-list-group__masters {
  display: flex;
  min-width: 0;
  align-items: center;
}

.board-list-group__heading {
  flex-wrap: wrap;
  gap: 0.35rem 1rem;
}

.board-list-group__heading h2 {
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
}

.board-list-group__masters {
  flex-wrap: wrap;
  gap: 0.25rem 1rem;
  font-size: 0.875rem;
}

.board-list-group__masters a,
.board-list-group__masters a:visited {
  color: #fff;
}

.board-list-group__masters a:hover {
  text-decoration: underline;
}

.board-list-group__toggle {
  flex: none;
  width: 2.5rem;
  height: 1.25rem;
  padding: 0;
  border: 1px solid #fff;
  border-radius: 999px;
  background: transparent;
  color: #fff;
  font: inherit;
  font-size: 0.75rem;
  line-height: 1.1rem;
  cursor: pointer;
}

.board-list-group__toggle:hover,
.board-list-group__toggle:focus-visible {
  background: rgb(255 255 255 / 0.15);
}

.board-list-group__content {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  background: var(--cc98-color-surface);
}

.board-list-group__content--compact {
  gap: 0 1.25rem;
  padding: 1rem 1.1rem 1.25rem;
}

@media (max-width: 1000px) {
  .board-list-group__content {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
