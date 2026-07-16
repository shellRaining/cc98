<script setup lang="ts">
import type { Board } from "@cc98/api";
import { computed, ref } from "vue";
import { BOARD_ICON_FALLBACK, boardIconUrl } from "../../lib/board-list.ts";
import ContentRenderer from "../rich-content/ContentRenderer.vue";

const props = defineProps<{
  board: Board;
  followPending?: boolean;
}>();

const emit = defineEmits<{
  toggleFollow: [];
}>();

const expanded = ref(false);
const boardName = computed(() => props.board.name?.trim() || "未命名版面");
const iconUrl = computed(() => props.board.logoUri || boardIconUrl(boardName.value));

function useFallbackIcon(event: Event) {
  const image = event.currentTarget as HTMLImageElement;
  if (!image.src.endsWith(BOARD_ICON_FALLBACK)) image.src = BOARD_ICON_FALLBACK;
}
</script>

<template>
  <section class="board-hero" :class="{ 'board-hero--expanded': expanded }">
    <div class="board-hero__summary">
      <div class="board-hero__identity">
        <img :src="iconUrl" alt="" @error="useFallbackIcon" />
        <div class="board-hero__name">
          <strong>{{ boardName }}</strong>
          <span>{{ board.todayCount ?? 0 }}/{{ board.topicCount ?? 0 }}</span>
          <button type="button" :disabled="followPending" @click="emit('toggleFollow')">
            {{ board.isUserCustomBoard ? "取关" : "关注" }}
          </button>
        </div>
      </div>

      <template v-if="expanded">
        <p class="board-hero__description">{{ board.description || "暂无版面简介。" }}</p>
        <div class="board-hero__masters">
          <strong>版主</strong>
          <div>
            <RouterLink
              v-for="master in board.boardMasters ?? []"
              :key="master"
              :to="`/user/name/${encodeURIComponent(master)}`"
            >
              {{ master }}
            </RouterLink>
            <span v-if="!board.boardMasters?.length">暂无</span>
          </div>
        </div>
      </template>
    </div>

    <div class="board-hero__paper">
      <button
        v-if="board.bigPaper"
        type="button"
        class="board-hero__expand"
        :aria-expanded="expanded"
        @click="expanded = !expanded"
      >
        {{ expanded ? "⌃ 收起" : "⌄ 展开" }}
      </button>

      <template v-if="expanded && board.bigPaper">
        <ContentRenderer type="ubb" :content="board.bigPaper" />
      </template>
      <template v-else>
        <p>版面简介：{{ board.description || "暂无" }}</p>
        <div class="board-hero__paper-masters">
          <span>版主：</span>
          <RouterLink
            v-for="master in board.boardMasters ?? []"
            :key="master"
            :to="`/user/name/${encodeURIComponent(master)}`"
          >
            {{ master }}
          </RouterLink>
          <span v-if="!board.boardMasters?.length">暂无</span>
        </div>
      </template>
    </div>
  </section>
</template>
