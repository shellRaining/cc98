<script setup lang="ts">
defineProps<{
  href: string;
  label?: string;
}>();
</script>

<template>
  <a class="cc98-link inline-flex items-center gap-1" :href="href" download>
    {{ label ?? "点击下载文件" }}
  </a>
</template>
