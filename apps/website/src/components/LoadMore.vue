<script setup lang="ts">
import UiButton from "./ui/Button.vue";

withDefaults(
  defineProps<{
    loading?: boolean;
    hasMore?: boolean;
    exhaustedMessage?: string;
  }>(),
  {
    loading: false,
    hasMore: false,
    exhaustedMessage: "没有更多了",
  },
);

const emit = defineEmits<{
  loadMore: [];
}>();
</script>

<template>
  <div class="py-3 text-sm text-center">
    <UiButton v-if="hasMore" variant="text" :loading="loading" @click="emit('loadMore')">
      {{ loading ? "加载中…" : "加载更多" }}
    </UiButton>
    <p v-else class="text-cc98-text-muted">{{ exhaustedMessage }}</p>
  </div>
</template>
