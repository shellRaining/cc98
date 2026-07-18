<script setup lang="ts">
import type { IndexColumn } from "@cc98/api";
import { computed, onMounted } from "vue";
import { useCarouselIndex } from "../../composables/useCarouselIndex";
import { isExternalHomepageUrl, normalizeHomepageAssetUrl } from "./model";
import HomeSectionHeader from "./HomeSectionHeader.vue";

const props = defineProps<{ items: IndexColumn[] }>();
const { index, select, setPaused } = useCarouselIndex(() => props.items.length);
const current = computed(() => props.items[index.value]);
const imageUrl = computed(() => normalizeHomepageAssetUrl(current.value?.imageUrl));

onMounted(() => {
  if (props.items.length > 1) select(Math.floor(Math.random() * props.items.length));
});
</script>

<template>
  <section
    v-if="current"
    class="home-block"
    @mouseenter="setPaused(true)"
    @mouseleave="setPaused(false)"
    @focusin="setPaused(true)"
    @focusout="setPaused(false)"
  >
    <HomeSectionHeader title="推荐阅读" tone="secondary" />
    <div class="home-panel home-panel--secondary home-reading">
      <img v-if="imageUrl" class="home-reading__image" :src="imageUrl" alt="" />
      <div class="home-reading__body">
        <a
          v-if="isExternalHomepageUrl(current.url)"
          class="home-reading__title"
          :href="current.url"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ current.title }}
        </a>
        <RouterLink v-else class="home-reading__title" :to="current.url || '/'">
          {{ current.title }}
        </RouterLink>
        <p class="home-reading__summary">{{ current.content }}</p>
        <div v-if="items.length > 1" class="home-carousel-dots" aria-label="切换推荐阅读">
          <button
            v-for="(_, itemIndex) in items"
            :key="itemIndex"
            type="button"
            :class="{ 'is-active': itemIndex === index }"
            :aria-label="`查看第 ${itemIndex + 1} 条推荐阅读`"
            :aria-current="itemIndex === index ? 'true' : undefined"
            @mouseenter="select(itemIndex)"
            @focus="select(itemIndex)"
            @click="select(itemIndex)"
          />
        </div>
      </div>
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

.home-panel--secondary {
  border-color: var(--cc98-color-secondary);
}

.home-reading {
  display: flex;
  height: 7.5rem;
  align-items: flex-start;
  gap: 1.25rem;
  padding: 1.25rem 1.25rem 0;
}

.home-reading__image {
  width: 3.75rem;
  height: 3.75rem;
  flex: none;
  border-radius: 50%;
  background: var(--cc98-color-secondary);
  object-fit: cover;
}

.home-reading__body {
  min-width: 0;
  flex: 1;
}

.home-reading__title {
  display: block;
  overflow: hidden;
  color: var(--cc98-color-text-muted);
  font-size: 1rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.home-reading__summary {
  margin: 0.45rem 0 0.65rem;
  overflow: hidden;
  color: var(--cc98-color-text-muted);
  font-size: 0.75rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.home-carousel-dots {
  display: flex;
  justify-content: flex-end;
  gap: 0.45rem;
}

.home-carousel-dots button {
  width: 0.625rem;
  height: 0.625rem;
  padding: 0;
  border: 1px solid var(--cc98-color-text-muted);
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
}

.home-carousel-dots button.is-active {
  border-color: var(--cc98-color-accent);
  background: var(--cc98-color-accent);
}
</style>
