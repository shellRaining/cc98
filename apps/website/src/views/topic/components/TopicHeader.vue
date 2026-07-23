<script setup lang="ts">
import type { Board, Topic } from "@cc98/api";
import { computed } from "vue";
import dayjs from "dayjs";

const props = defineProps<{
  topic: Topic;
  board: Board;
  tagNames?: string[];
  imagesCollapsed?: boolean;
  shareStatus?: string;
}>();

const emit = defineEmits<{
  toggleImages: [];
  share: [];
}>();

const boardUrl = computed(() => `/list/${props.board.id}`);

function formatTime(value?: string) {
  if (!value) return "—";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD HH:mm:ss") : value;
}
</script>

<template>
  <section class="topic-hero">
    <div class="topic-hero__main">
      <div class="topic-hero__content">
        <h1 :title="topic.title">{{ topic.title || "(无标题)" }}</h1>
        <div class="topic-hero__meta">
          <span v-if="tagNames?.length">标签：{{ tagNames.join(" ") }}</span>
          <time :datetime="topic.time" title="发布时间">◷ {{ formatTime(topic.time) }}</time>
          <span title="浏览数">◉ {{ topic.hitCount ?? 0 }}</span>
          <span title="收藏数">☆ {{ topic.favoriteCount ?? 0 }}</span>
          <slot name="favorite" />
          <button type="button" @click="emit('toggleImages')">
            {{ imagesCollapsed ? "显示所有图片" : "收起所有图片" }}
          </button>
          <button type="button" @click="emit('share')">分享帖子链接</button>
          <span v-if="shareStatus" role="status">{{ shareStatus }}</span>
        </div>
      </div>
      <RouterLink :to="boardUrl" class="topic-hero__board">
        <strong>{{ board.name }}</strong>
        <span>{{ board.todayCount ?? 0 }} / {{ board.topicCount ?? 0 }}</span>
      </RouterLink>
    </div>
    <div class="topic-hero__ad"><slot name="advertisement" /></div>
  </section>
</template>

<style scoped>
.topic-hero {
  display: grid;
  width: 100%;
  height: 6.5rem;
  grid-template-columns: minmax(0, 1fr) 18.65rem;
  overflow: hidden;
  border: 2px solid #6b7178;
  background: var(--cc98-color-surface);
}

.topic-hero__main {
  display: grid;
  min-width: 0;
  grid-template-columns: minmax(0, 1fr) 10.6rem;
}

.topic-hero__content {
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: space-between;
  padding: 0.55rem 1.4rem 0.75rem;
}

.topic-hero__content h1 {
  display: -webkit-box;
  max-height: 3.5rem;
  margin: 0;
  overflow: hidden;
  color: var(--cc98-color-text);
  font-size: 1.25rem;
  font-weight: 400;
  line-height: 1.75rem;
  overflow-wrap: anywhere;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.topic-hero__meta {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.45rem;
  color: var(--cc98-color-primary);
  font-size: 0.75rem;
  line-height: 1.25rem;
  white-space: nowrap;
}

.topic-hero__meta > span:first-child {
  max-width: 10rem;
  overflow: hidden;
  text-overflow: ellipsis;
}

.topic-hero__meta :deep(button),
.topic-hero__meta a {
  display: inline-grid;
  width: auto;
  min-width: 2.75rem;
  height: 1.25rem;
  padding: 0 0.45rem;
  border: 1px solid var(--cc98-color-primary);
  border-radius: 999px;
  background: transparent;
  color: var(--cc98-color-primary);
  font: inherit;
  line-height: 1;
  cursor: pointer;
  place-items: center;
}

.topic-hero__meta :deep(button:hover),
.topic-hero__meta a:hover {
  background: var(--cc98-color-primary-fill);
  color: #fff;
}

.topic-hero__meta > div {
  display: contents;
}

.topic-hero__board,
.topic-hero__board:visited {
  display: flex;
  align-items: center;
  justify-content: center;
  border-left: 1.5px solid #6b7178;
  color: #6b7178;
  flex-direction: column;
  gap: 0.5rem;
  text-align: center;
}

.topic-hero__board strong {
  max-width: 8.5rem;
  overflow: hidden;
  font-size: 1rem;
  font-weight: 400;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.topic-hero__board span {
  font-size: 0.75rem;
}

.topic-hero__ad {
  min-width: 0;
  height: 6.25rem;
}

.topic-hero__ad :deep(.home-advertisement) {
  height: 100%;
}

@media (max-width: 1180px) {
  .topic-hero {
    grid-template-columns: minmax(0, 1fr) 17rem;
  }

  .topic-hero__main {
    grid-template-columns: minmax(0, 1fr) 9rem;
  }

  .topic-hero__meta {
    gap: 0.3rem;
  }
}

@media (max-width: 1000px) {
  .topic-hero {
    height: auto;
    grid-template-columns: minmax(0, 1fr);
  }

  .topic-hero__ad {
    display: none;
  }
}
</style>
