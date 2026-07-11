<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";
import type { Topic } from "@cc98/api";
import dayjs from "dayjs";

const props = defineProps<{
  topic: Topic;
  pinned?: boolean;
}>();

const topicId = computed(() => props.topic.id ?? 0);
const title = computed(() => props.topic.title?.trim() || "(无标题)");
const author = computed(() => {
  if (props.topic.isAnonymous) return "匿名用户";
  return props.topic.userName?.trim() || "已注销用户";
});
const lastReplyUser = computed(() => props.topic.lastPostUser?.trim() || "—");
const replyCount = computed(() => props.topic.replyCount ?? 0);
const hitCount = computed(() => props.topic.hitCount ?? 0);
const lastPage = computed(() => Math.max(1, Math.ceil((replyCount.value + 1) / 10)));

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
</script>

<template>
  <li class="border-b border-cc98-border py-3 last:border-b-0">
    <div class="flex flex-wrap items-baseline gap-2">
      <span
        v-if="topLabel"
        class="text-xs text-cc98-primary border border-cc98-primary px-1 rounded"
      >
        {{ topLabel }}
      </span>
      <RouterLink :to="`/topic/${topicId}`" class="cc98-link font-medium" :style="titleStyle">
        {{ title }}
      </RouterLink>
    </div>
    <div class="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-cc98-text-muted">
      <span>{{ author }} · {{ timeText }}</span>
      <span>回复 {{ replyCount }} · 浏览 {{ hitCount }}</span>
      <span>最后回复 {{ lastReplyUser }} · {{ lastReplyTime }}</span>
      <span class="flex gap-2">
        <RouterLink :to="`/topic/${topicId}`" class="cc98-link">首页</RouterLink>
        <RouterLink v-if="lastPage > 1" :to="`/topic/${topicId}/${lastPage}`" class="cc98-link">
          末页
        </RouterLink>
      </span>
    </div>
  </li>
</template>
