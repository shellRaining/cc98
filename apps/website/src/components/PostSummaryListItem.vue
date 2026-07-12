<script setup lang="ts">
import type { Post } from "@cc98/api";
import dayjs from "dayjs";
import { computed } from "vue";
import { RouterLink } from "vue-router";
import { postExcerpt } from "../lib/user-center";

const props = defineProps<{
  post: Post;
  boardName?: string;
}>();

const topicLink = computed(() => {
  if (props.post.topicId == null) return null;
  const floor = props.post.floor;
  return floor != null && floor > 0
    ? `/topic/${props.post.topicId}#floor-${floor}`
    : `/topic/${props.post.topicId}`;
});
const boardLink = computed(() =>
  props.post.boardId != null ? `/list/${props.post.boardId}` : null,
);
const timeText = computed(() => {
  if (!props.post.time) return "—";
  const parsed = dayjs(props.post.time);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD HH:mm") : props.post.time;
});
const excerpt = computed(() => postExcerpt(props.post.content, props.post.contentType));
</script>

<template>
  <li class="py-4 space-y-2">
    <div class="flex flex-wrap items-center gap-2 text-xs text-cc98-text-muted">
      <RouterLink v-if="boardLink" :to="boardLink" class="cc98-link">
        [{{ boardName || `版面 ${post.boardId}` }}]
      </RouterLink>
      <span v-if="post.floor != null">#{{ post.floor }}</span>
      <span>{{ timeText }}</span>
      <span v-if="post.likeCount != null">赞 {{ post.likeCount }}</span>
    </div>
    <p class="text-sm text-cc98-text whitespace-pre-wrap break-words">{{ excerpt }}</p>
    <RouterLink v-if="topicLink" :to="topicLink" class="cc98-link text-sm">查看所在主题</RouterLink>
  </li>
</template>
