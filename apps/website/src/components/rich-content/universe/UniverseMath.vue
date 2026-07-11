<script setup lang="ts">
import "katex/dist/katex.min.css";
import katex from "katex";
import { computed } from "vue";

const props = defineProps<{
  content: string;
  inline?: boolean;
}>();

const rendered = computed(() =>
  katex.renderToString(props.content, {
    displayMode: !props.inline,
    throwOnError: false,
    trust: false,
  }),
);
</script>

<template>
  <span v-if="inline" class="inline-block" v-html="rendered" />
  <div v-else class="my-3 overflow-x-auto" v-html="rendered" />
</template>
