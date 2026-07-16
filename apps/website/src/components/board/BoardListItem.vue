<script setup lang="ts">
import type { Board } from "@cc98/api";
import { BOARD_ICON_FALLBACK, boardIconUrl } from "../../lib/board-list";

defineProps<{
  board: Board;
  compact?: boolean;
}>();

function useFallbackIcon(event: Event) {
  const image = event.currentTarget as HTMLImageElement;
  if (!image.src.endsWith(BOARD_ICON_FALLBACK)) image.src = BOARD_ICON_FALLBACK;
}
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
        <img :src="boardIconUrl(board.name)" alt="" @error="useFallbackIcon" />
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
