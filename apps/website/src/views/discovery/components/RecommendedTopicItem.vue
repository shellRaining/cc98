<script setup lang="ts">
import type { BasicUser, Board, RecommendedTopic } from "@cc98/api";
import { computed } from "vue";
import { resolveAvatarUrl } from "../../../components/user/avatar";
import { formatDiscoveryTime } from "../time";

const props = defineProps<{
  item: RecommendedTopic & { topic: NonNullable<RecommendedTopic["topic"]> };
  board?: Board;
  author?: BasicUser;
}>();

const topic = computed(() => props.item.topic);
const anonymous = computed(() => topic.value.isAnonymous || topic.value.userId == null);
const authorName = computed(() =>
  anonymous.value ? "匿名用户" : topic.value.userName || "已注销用户",
);
const authorUrl = computed(() =>
  anonymous.value || topic.value.userId == null ? null : `/user/id/${topic.value.userId}`,
);
const avatar = computed(() =>
  anonymous.value ? "/static/images/_心灵之约.png" : resolveAvatarUrl(props.author?.portraitUrl),
);
const summary = computed(() => props.item.content?.replace(/\s+/g, " ").trim() || "暂无推荐语");

function replaceBrokenAvatar(event: Event) {
  const image = event.currentTarget as HTMLImageElement;
  image.src = anonymous.value
    ? "/static/images/_心灵之约.png"
    : "/static/images/default_avatar_boy.png";
}
</script>

<template>
  <article class="new-topic-classic-item recommended-topic-item">
    <component
      :is="authorUrl ? 'RouterLink' : 'div'"
      :to="authorUrl || undefined"
      class="new-topic-classic-item__author"
    >
      <img
        :src="avatar"
        :alt="anonymous ? '匿名用户头像' : `${authorName} 的头像`"
        @error="replaceBrokenAvatar"
      />
      <span>{{ authorName }}</span>
    </component>

    <div class="new-topic-classic-item__body">
      <RouterLink :to="`/topic/${topic.id}`" class="new-topic-classic-item__title">
        {{ topic.title?.trim() || "（无标题）" }}
      </RouterLink>
      <div class="new-topic-classic-item__meta recommended-topic-item__meta">
        <time :datetime="topic.time">◷ {{ formatDiscoveryTime(topic.time) }}</time>
        <span title="推荐语">▣ {{ summary }}</span>
      </div>
    </div>

    <RouterLink :to="`/list/${topic.boardId}`" class="new-topic-classic-item__board">
      {{ board?.name || topic.boardName || `版面 ${topic.boardId}` }}
    </RouterLink>
  </article>
</template>

<style scoped>
.new-topic-classic-item {
  display: grid;
  min-height: 5rem;
  grid-template-columns: 11.25rem minmax(0, 1fr) 6.25rem;
  overflow: hidden;
  border: 1px solid var(--cc98-color-primary);
  background: var(--cc98-color-surface);
}

.new-topic-classic-item__author,
.new-topic-classic-item__author:visited {
  display: flex;
  min-width: 0;
  align-items: center;
  background: var(--cc98-color-primary);
  color: #fff;
}

.new-topic-classic-item__author img {
  width: 3.75rem;
  height: 3.75rem;
  margin: 0.625rem;
  border-radius: 50%;
  object-fit: cover;
}

.new-topic-classic-item__author span {
  min-width: 0;
  overflow: hidden;
  font-size: 1rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.new-topic-classic-item__body {
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: space-between;
  padding: 0.6rem 1.25rem 0.75rem;
}

.new-topic-classic-item__title,
.new-topic-classic-item__title:visited {
  overflow: hidden;
  color: var(--cc98-color-text);
  font-size: 1.25rem;
  line-height: 1.75rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.new-topic-classic-item__meta {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 1.25rem;
  overflow: hidden;
  color: var(--cc98-color-text);
  font-size: 0.75rem;
  line-height: 1rem;
  white-space: nowrap;
}

.new-topic-classic-item__meta a,
.new-topic-classic-item__meta a:visited {
  color: var(--cc98-color-text);
}

.new-topic-classic-item__board,
.new-topic-classic-item__board:visited {
  display: grid;
  padding-inline: 0.75rem;
  border-left: 1px solid var(--cc98-color-text);
  color: var(--cc98-color-text);
  line-height: 1.25rem;
  place-items: center;
  text-align: center;
}

.recommended-topic-item__meta span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 1000px) {
  .new-topic-classic-item {
    grid-template-columns: 9rem minmax(0, 1fr);
  }

  .new-topic-classic-item__board {
    display: none;
  }
}
</style>
