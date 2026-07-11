<script setup lang="ts">
defineProps<{
  href: string;
  title?: string;
}>();
</script>

<template>
  <a class="cc98-link break-all" :href="href" :title="title" rel="noopener noreferrer">
    <slot />
  </a>
</template>
