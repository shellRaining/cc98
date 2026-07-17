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
