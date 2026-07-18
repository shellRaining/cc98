<script setup lang="ts">
import type { Topic } from "@cc98/api";
import { computed } from "vue";

const props = defineProps<{ topic: Topic; pinned?: boolean }>();

const kind = computed(() => {
  if (props.topic.topState === 4) return "global-top";
  if (props.pinned || (props.topic.topState ?? 0) > 0) return "top";
  if (props.topic.bestState === 1) return "best";
  if (props.topic.state === 1) return "locked";
  if ((props.topic.replyCount ?? 0) > 100) return "hot";
  return "normal";
});

const label = computed(
  () =>
    ({
      "global-top": "全站置顶",
      top: "版面置顶",
      best: "精华主题",
      locked: "锁定主题",
      hot: "热门主题",
      normal: "普通主题",
    })[kind.value],
);
</script>

<template>
  <span class="board-topic-state" :class="`board-topic-state--${kind}`" :title="label">
    <svg v-if="kind === 'best'" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 2.7 2.8 5.7 6.3.9-4.6 4.4 1.1 6.3-5.6-3-5.6 3 1.1-6.3-4.6-4.4 6.3-.9z" />
    </svg>
    <svg v-else-if="kind === 'locked'" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 10V7a5 5 0 0 1 10 0v3h2v11H5V10zm2 0h6V7a3 3 0 0 0-6 0z" />
    </svg>
    <svg v-else-if="kind === 'top' || kind === 'global-top'" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path class="board-topic-state__cutout" d="m7 13 5-5 5 5h-3v5h-4v-5z" />
    </svg>
    <svg v-else viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 5h18v14H3zm2 2v1.2l7 4.4 7-4.4V7zm14 10v-6.4L12 15l-7-4.4V17z" />
    </svg>
    <span class="sr-only">{{ label }}</span>
  </span>
</template>

<style scoped>
.board-topic-state {
  display: block;
  width: 1rem;
  height: 1rem;
  flex: none;
  color: #ffc90e;
}

.board-topic-state svg {
  display: block;
  width: 100%;
  height: 100%;
  fill: currentcolor;
}

.board-topic-state--hot,
.board-topic-state--global-top {
  color: #e33131;
}

.board-topic-state--top {
  color: #f28c1b;
}

.board-topic-state--best {
  color: #ff1493;
}

.board-topic-state--locked {
  color: #b0b0b0;
}

.board-topic-state__cutout {
  fill: var(--cc98-color-surface);
}
</style>
