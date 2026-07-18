<script setup lang="ts">
import HomeSectionHeader from "./HomeSectionHeader.vue";

defineProps<{ title: string; src: string }>();
</script>

<template>
  <section class="home-sidebar-block home-qr-card">
    <HomeSectionHeader :title="title" tone="secondary" />
    <img :src="src" :alt="`${title}二维码`" />
  </section>
</template>

<style scoped>
.home-sidebar-block {
  min-width: 0;
}

.home-qr-card img {
  display: block;
  width: 100%;
  margin-top: 0.75rem;
  background: #fff;
}
</style>
