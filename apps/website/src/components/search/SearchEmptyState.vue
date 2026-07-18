<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  target: "版面" | "帖子";
  hasKeyword: boolean;
}>();

const message = computed(() =>
  props.hasKeyword
    ? `-----------------------抱歉呢前辈，没有找到你想要的${props.target}哦~----------------------`
    : `请在顶部搜索框输入${props.target}关键词。`,
);
</script>

<template>
  <div class="search-empty" role="status">
    <img src="/static/images/searchNone.png" alt="" aria-hidden="true" />
    <p>{{ message }}</p>
  </div>
</template>

<style scoped>
.search-empty {
  display: flex;
  min-height: 34rem;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  color: var(--cc98-color-text-muted);
  text-align: center;
}

.search-empty img {
  display: block;
  width: 22.5rem;
  max-width: 50%;
}

.search-empty p {
  margin: 1.25rem 0 0;
  font-size: 1rem;
}
</style>
