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
