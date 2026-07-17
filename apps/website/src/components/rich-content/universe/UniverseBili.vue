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
    return `https://player.bilibili.com/player.html?bvid=${props.bvid}&page=${page}&autoplay=0&poster=1`;
  }
  if (props.aid) {
    return `https://player.bilibili.com/player.html?aid=${props.aid}&page=${page}&autoplay=0&poster=1`;
  }
  return null;
});
</script>

<template>
  <div v-if="src" class="ubb-bili-player">
    <iframe :src="src" scrolling="no" allowfullscreen />
  </div>
</template>

<style scoped>
.ubb-bili-player {
  width: 40rem;
  max-width: 100%;
}

.ubb-bili-player iframe {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  border: 0;
}
</style>
