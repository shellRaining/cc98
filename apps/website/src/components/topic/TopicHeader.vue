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
