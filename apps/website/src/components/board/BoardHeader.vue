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

<style scoped>
.board-hero {
  display: grid;
  min-height: 6rem;
  overflow: hidden;
  border: 2px solid #6b7178;
  grid-template-columns: 15rem minmax(0, 1fr);
  transition: min-height 0.3s ease;
}

.board-hero--expanded {
  min-height: 20rem;
}

.board-hero__summary {
  min-width: 0;
  background: #6b7178;
  color: #fff;
}

.board-hero__identity {
  display: flex;
  height: 6rem;
  align-items: center;
  padding-inline: 1.25rem;
}

.board-hero__identity img {
  width: 4rem;
  height: 4rem;
  flex: none;
  border-radius: 50%;
  background: var(--cc98-color-primary);
  object-fit: contain;
}

.board-hero__name {
  display: grid;
  min-width: 0;
  margin-left: 1rem;
  grid-template-columns: 4.5rem 3rem;
  grid-template-rows: 2rem 1.5rem;
  align-items: center;
}

.board-hero__name strong {
  overflow: hidden;
  grid-column: 1 / -1;
  font-size: 1rem;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.board-hero__name span {
  font-size: 0.75rem;
}

.board-hero__name button {
  width: 3rem;
  height: 1.4rem;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: #fb6165;
  color: #fff;
  font: inherit;
  font-size: 0.875rem;
  line-height: 1.3rem;
  cursor: pointer;
}

.board-hero__name button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.board-hero__description,
.board-hero__masters {
  margin: 1.5rem 1rem 0;
  font-size: 0.75rem;
  line-height: 1.4rem;
}

.board-hero__masters {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.board-hero__masters > div {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.75rem;
}

.board-hero__masters a,
.board-hero__masters a:visited {
  color: #fff;
}

.board-hero__paper {
  position: relative;
  min-width: 0;
  padding: 1.5rem;
  overflow-wrap: anywhere;
  background: var(--cc98-color-surface);
  font-size: 1rem;
}

.board-hero__paper > p {
  margin: 0 0 0.5rem;
}

.board-hero__paper-masters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.75rem;
  font-size: 0.75rem;
}

.board-hero__expand {
  position: absolute;
  top: 0.5rem;
  right: 0.75rem;
  border: 0;
  background: transparent;
  color: var(--cc98-color-text);
  font: inherit;
  font-size: 0.75rem;
  cursor: pointer;
}

.board-hero__paper :deep(.rich-content) {
  max-width: 53.25rem;
}
</style>
