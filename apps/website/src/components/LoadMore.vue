<script setup lang="ts">
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
    <button
      v-if="hasMore"
      type="button"
      class="cc98-link disabled:opacity-50 disabled:cursor-not-allowed"
      :disabled="loading"
      @click="emit('loadMore')"
    >
      {{ loading ? "加载中…" : "加载更多" }}
    </button>
    <p v-else class="text-cc98-text-muted">{{ exhaustedMessage }}</p>
  </div>
</template>
