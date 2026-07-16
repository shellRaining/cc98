<script setup lang="ts">
import type { BasicUser, Board, RecommendedTopic } from "@cc98/api";
import { computed } from "vue";
import { formatDiscoveryTime } from "../../lib/discovery";

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
  anonymous.value
    ? "/static/images/_心灵之约.png"
    : props.author?.portraitUrl || "/static/images/default_avatar_boy.png",
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
