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

<style scoped>
.home-block {
  margin-bottom: 1.25rem;
}

.home-panel {
  margin-top: 0.75rem;
  border: 1px solid currentcolor;
  border-top-width: 8px;
  background: var(--cc98-color-surface);
  color: var(--cc98-color-text);
}

.home-panel--primary {
  border-color: var(--cc98-color-primary);
}

.home-announcement {
  min-height: 8.25rem;
  padding: 1rem 1.25rem;
  font-size: 1rem;
}

.home-announcement article > :first-child,
.home-announcement p:first-child {
  margin-top: 0;
}

.home-announcement article > :last-child,
.home-announcement p:last-child {
  margin-bottom: 0;
}
</style>
