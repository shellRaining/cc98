<script setup lang="ts">
defineProps<{
  content: string;
}>();
</script>

<template>
  <span class="whitespace-pre-wrap">{{ content }}</span>
</template>
