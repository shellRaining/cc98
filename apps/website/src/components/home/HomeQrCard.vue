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
