<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";
import type { Topic } from "@cc98/api";
import dayjs from "dayjs";
import { userIdPath } from "../lib/discovery";
import TopicStateIcon from "./board/TopicStateIcon.vue";

const props = withDefaults(
  defineProps<{
    topic: Topic;
    pinned?: boolean;
    showBoard?: boolean;
    variant?: "default" | "board";
    tagNames?: Map<number, string>;
    selectable?: boolean;
    selected?: boolean;
  }>(),
  {
    showBoard: true,
    variant: "default",
  },
);

const emit = defineEmits<{
  toggle: [checked: boolean];
}>();

const topicId = computed(() => props.topic.id ?? 0);
const title = computed(() => props.topic.title?.trim() || "(无标题)");
const isAnonymous = computed(() => props.topic.isAnonymous === true);
const author = computed(() => {
  if (isAnonymous.value) return "匿名用户";
  return props.topic.userName?.trim() || "已注销用户";
});
const authorLink = computed(() => {
  if (isAnonymous.value) return null;
  const id = props.topic.userId;
  if (id == null || id <= 0) return null;
  return userIdPath(id);
});
const boardName = computed(() => props.topic.boardName?.trim() || null);
const boardLink = computed(() => {
  const id = props.topic.boardId;
  if (id == null || id <= 0) return null;
  return `/list/${id}`;
});
const lastReplyUser = computed(() => props.topic.lastPostUser?.trim() || "—");
const replyCount = computed(() => props.topic.replyCount ?? 0);
const hitCount = computed(() => props.topic.hitCount ?? 0);
const likeCount = computed(() => props.topic.likeCount);
const lastPage = computed(() => Math.max(1, Math.ceil((replyCount.value + 1) / 10)));
const quickPages = computed(() => {
  if (lastPage.value <= 1) return [];
  if (lastPage.value <= 5)
    return Array.from({ length: lastPage.value - 1 }, (_, index) => index + 2);
  return [2, 3, 4, lastPage.value];
});

const tagLabels = computed(() => {
  if ((props.topic.topState ?? 0) > 0 || props.pinned) return [];
  const result: string[] = [];
  for (const id of [props.topic.tag1, props.topic.tag2]) {
    if (id != null && id > 0) result.push(props.tagNames?.get(id) ?? String(id));
  }
  return result;
});

const timeText = computed(() => formatTime(props.topic.time));
const lastReplyTime = computed(() => formatTime(props.topic.lastPostTime));

const titleStyle = computed(() => {
  const info = props.topic.highlightInfo as
    | { isBold?: boolean; isItalic?: boolean; color?: string }
    | null
    | undefined;
  if (!info) return undefined;
  const style: Record<string, string> = {};
  if (info.isBold) style.fontWeight = "700";
  if (info.isItalic) style.fontStyle = "italic";
  if (typeof info.color === "string" && /^#[0-9a-fA-F]{3,8}$/.test(info.color)) {
    style.color = info.color;
  }
  return Object.keys(style).length ? style : undefined;
});

const topLabel = computed(() => {
  if (props.pinned) return "置顶";
  const state = props.topic.topState ?? 0;
  if (state > 0) return "置顶";
  return null;
});

function formatTime(value: string | undefined): string {
  if (!value) return "—";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD HH:mm") : value;
}

function formatCount(value: number): string {
  if (value >= 100_000) return `${Math.floor(value / 10_000)}万`;
  if (value >= 10_000) return `${(value / 10_000).toFixed(1)}万`;
  return String(value);
}
</script>

<template>
  <li v-if="variant === 'board'" class="board-topic-row">
    <div class="board-topic-row__title">
      <input
        v-if="selectable"
        type="checkbox"
        class="board-topic-row__checkbox"
        :checked="selected"
        :aria-label="`选择主题：${title}`"
        @change="emit('toggle', ($event.target as HTMLInputElement).checked)"
      />
      <TopicStateIcon :topic="topic" :pinned="pinned" />
      <div class="board-topic-row__title-content">
        <RouterLink :to="`/topic/${topicId}`" :style="titleStyle">
          <span v-if="topic.isVote" class="board-topic-row__tag">[投票]</span>
          <span v-for="tag in tagLabels" :key="tag" class="board-topic-row__tag">[{{ tag }}]</span>
          {{ title }}
        </RouterLink>
        <span v-if="quickPages.length" class="board-topic-row__pages">
          <RouterLink
            v-for="pageNumber in quickPages"
            :key="pageNumber"
            :to="`/topic/${topicId}/${pageNumber}`"
          >
            <template v-if="pageNumber === lastPage && lastPage > 5">…</template>{{ pageNumber }}
          </RouterLink>
        </span>
      </div>
    </div>
    <div class="board-topic-row__author">
      <RouterLink v-if="authorLink" :to="authorLink">{{ author }}</RouterLink>
      <span v-else>{{ author }}</span>
    </div>
    <div class="board-topic-row__counts" aria-label="浏览与回复">
      <span title="浏览">◉ {{ formatCount(hitCount) }}</span>
      <span title="回复">▢ {{ formatCount(replyCount) }}</span>
    </div>
    <div class="board-topic-row__last">
      <span>{{ lastReplyUser }}/</span>
      <time :datetime="topic.lastPostTime">{{ lastReplyTime.slice(2) }}</time>
    </div>
    <slot />
  </li>

  <li v-else class="border-b border-cc98-border py-3 last:border-b-0">
    <div class="flex flex-wrap items-baseline gap-2">
      <span
        v-if="topLabel"
        class="text-xs text-cc98-primary border border-cc98-primary px-1 rounded"
      >
        {{ topLabel }}
      </span>
      <template v-if="showBoard && boardName && boardLink">
        <RouterLink :to="boardLink" class="text-xs text-cc98-text-muted hover:text-cc98-primary">
          [{{ boardName }}]
        </RouterLink>
      </template>
      <RouterLink :to="`/topic/${topicId}`" class="cc98-link font-medium" :style="titleStyle">
        {{ title }}
      </RouterLink>
    </div>
    <div class="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-cc98-text-muted">
      <span>
        <RouterLink v-if="authorLink" :to="authorLink" class="cc98-link">{{ author }}</RouterLink>
        <template v-else>{{ author }}</template>
        · {{ timeText }}
      </span>
      <span>
        回复 {{ replyCount }} · 浏览 {{ hitCount
        }}<template v-if="likeCount != null"> · 赞 {{ likeCount }}</template>
      </span>
      <span>最后回复 {{ lastReplyUser }} · {{ lastReplyTime }}</span>
      <span class="flex gap-2">
        <RouterLink :to="`/topic/${topicId}`" class="cc98-link">首页</RouterLink>
        <RouterLink v-if="lastPage > 1" :to="`/topic/${topicId}/${lastPage}`" class="cc98-link">
          末页
        </RouterLink>
      </span>
    </div>
    <slot />
  </li>
</template>
