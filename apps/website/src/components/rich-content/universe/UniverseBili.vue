<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  aid?: string;
  bvid?: string;
  page?: number;
}>();

const src = computed(() => {
  const page = props.page ?? 1;
  if (props.bvid) {
    return `https://player.bilibili.com/player.html?bvid=${props.bvid}&page=${page}&autoplay=0`;
  }
  if (props.aid) {
    return `https://player.bilibili.com/player.html?aid=${props.aid}&page=${page}&autoplay=0`;
  }
  return null;
});
</script>

<template>
  <div v-if="src" class="w-full max-w-2xl">
    <iframe :src="src" class="aspect-video w-full border-0" scrolling="no" allowfullscreen />
  </div>
</template>
