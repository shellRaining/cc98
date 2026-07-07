<script setup lang="ts">
import { RouterLink } from "vue-router";
</script>

<template>
  <section class="text-center py-12 space-y-4">
    <h1 class="text-4xl font-bold">404</h1>
    <p class="text-cc98-text-muted">页面不存在。</p>
    <RouterLink to="/" class="cc98-link">返回首页</RouterLink>
  </section>
</template>
