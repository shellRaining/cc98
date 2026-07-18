<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  code: string;
}>();

const lines = computed(() => {
  const result = props.code.split("\n");
  while (result.length && !result[0]) result.shift();
  while (result.length && !result[result.length - 1]) result.pop();
  return result;
});
</script>

<template>
  <div class="ubb-code-block">
    <ol>
      <li v-for="(line, index) in lines" :key="index">{{ line }}</li>
    </ol>
  </div>
</template>

<style scoped>
.ubb-code-block {
  max-width: 100%;
  margin-block: 1rem;
}

.ubb-code-block ol {
  margin: 0;
  padding: 0;
  overflow-x: auto;
  counter-reset: line;
  font-family: Consolas, Monaco, monospace;
  list-style: none;
  white-space: pre;
}

.ubb-code-block li {
  display: flex;
  min-width: max-content;
  counter-increment: line;
  line-height: 1.5;
}

.ubb-code-block li::before {
  display: inline-flex;
  width: 3.125rem;
  flex: none;
  justify-content: center;
  margin-inline: 0.625rem;
  background: var(--cc98-color-surface-subtle);
  color: var(--cc98-color-text-muted);
  content: counter(line);
}

.ubb-code-block li:empty::after {
  content: " ";
}
</style>
