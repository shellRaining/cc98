<script setup lang="ts">
import type { BasicUser, Board, Topic } from "@cc98/api";
import { computed } from "vue";
import { floorAnchorId, floorToPage } from "../../lib/route-params";
import { formatDiscoveryTime } from "../../lib/discovery";

const props = defineProps<{
  topic: Topic;
  board?: Board;
  author?: BasicUser;
  tagNames?: string[];
}>();

const anonymous = computed(() => props.topic.isAnonymous || props.topic.userId == null);
const authorName = computed(() =>
  anonymous.value ? "匿名用户" : props.topic.userName || "已注销用户",
);
const authorUrl = computed(() =>
  anonymous.value || props.topic.userId == null ? null : `/user/id/${props.topic.userId}`,
);
const avatar = computed(() =>
  anonymous.value
    ? "/static/images/_心灵之约.png"
    : props.author?.portraitUrl || "/static/images/default_avatar_boy.png",
);
const floor = computed(() => Math.max(1, (props.topic.replyCount ?? 0) + 1));
const lastPostUrl = computed(() => ({
  name: "topic" as const,
  params: {
    topicId: String(props.topic.id),
    ...(floorToPage(floor.value) > 1 ? { page: String(floorToPage(floor.value)) } : {}),
  },
  hash: `#${floorAnchorId(floor.value)}`,
}));

function replaceBrokenAvatar(event: Event) {
  const image = event.currentTarget as HTMLImageElement;
  image.src = anonymous.value
    ? "/static/images/_心灵之约.png"
    : "/static/images/default_avatar_boy.png";
}
</script>

<template>
  <article class="new-topic-classic-item">
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
      <div class="new-topic-classic-item__meta">
        <span v-if="tagNames?.length">标签：{{ tagNames.join(" / ") }}</span>
        <time :datetime="topic.time">◷ {{ formatDiscoveryTime(topic.time) }}</time>
        <span>◉ {{ topic.hitCount ?? 0 }}</span>
        <span>
          最后回复：
          <RouterLink
            v-if="topic.lastPostUser"
            :to="`/user/name/${encodeURIComponent(topic.lastPostUser)}`"
          >
            {{ topic.lastPostUser }}
          </RouterLink>
          <span v-else>暂无</span>
        </span>
        <RouterLink :to="lastPostUrl">{{ formatDiscoveryTime(topic.lastPostTime) }}</RouterLink>
      </div>
    </div>

    <RouterLink :to="`/list/${topic.boardId}`" class="new-topic-classic-item__board">
      {{ board?.name || topic.boardName || `版面 ${topic.boardId}` }}
    </RouterLink>
  </article>
</template>
