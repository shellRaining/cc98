<script setup lang="ts">
import { ref } from "vue";
import type { BoardGroup } from "@cc98/api";
import { boardGroupAnchor, isCompactBoardGroup } from "../../lib/board-list";
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
