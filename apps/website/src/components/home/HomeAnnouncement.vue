<script setup lang="ts">
import ContentRenderer from "../rich-content/ContentRenderer.vue";
import HomeSectionHeader from "./HomeSectionHeader.vue";

defineProps<{ content: string }>();
</script>

<template>
  <section v-if="content.trim()" class="home-block">
    <HomeSectionHeader title="全站公告" />
    <div class="home-panel home-panel--primary home-announcement">
      <ContentRenderer :content="content" type="ubb" />
    </div>
  </section>
</template>
