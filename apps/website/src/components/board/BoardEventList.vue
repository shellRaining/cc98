<script setup lang="ts">
import type { BoardEvent } from "@cc98/api";
import dayjs from "dayjs";

defineProps<{ events: BoardEvent[] }>();

function formatTime(value: string) {
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("YY-MM-DD HH:mm") : value;
}
</script>

<template>
  <div class="board-event-list">
    <div class="board-event-list__head">
      <span>版务记录</span><span>操作人</span><span>时间</span>
    </div>
    <RouterLink
      v-for="event in events"
      :key="event.id"
      :to="`/topic/${event.topicId}`"
      class="board-event-list__item"
    >
      <span>{{ event.content }}</span>
      <span>{{ event.operatorUserName }}</span>
      <time :datetime="event.time">{{ formatTime(event.time) }}</time>
    </RouterLink>
  </div>
</template>
