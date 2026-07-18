<script setup lang="ts">
import type { IndexColumn } from "@cc98/api";
import { computed } from "vue";
import { useCarouselIndex } from "../../composables/useCarouselIndex";
import { isExternalHomepageUrl, normalizeHomepageAssetUrl } from "../../lib/home";

const props = defineProps<{ items: IndexColumn[] }>();
const { index, select, setPaused } = useCarouselIndex(() => props.items.length);
const current = computed(() => props.items[index.value]);
const imageUrl = computed(() => normalizeHomepageAssetUrl(current.value?.imageUrl));
</script>

<template>
  <div
    v-if="current && imageUrl"
    class="home-advertisement"
    @mouseenter="setPaused(true)"
    @mouseleave="setPaused(false)"
    @focusin="setPaused(true)"
    @focusout="setPaused(false)"
  >
    <a
      v-if="isExternalHomepageUrl(current.url)"
      :href="current.url"
      target="_blank"
      rel="noopener noreferrer"
    >
      <img :src="imageUrl" :alt="current.title || 'CC98 推荐内容'" />
    </a>
    <RouterLink v-else :to="current.url || '/'">
      <img :src="imageUrl" :alt="current.title || 'CC98 推荐内容'" />
    </RouterLink>
    <div v-if="items.length > 1" class="home-advertisement__dots">
      <button
        v-for="(_, itemIndex) in items"
        :key="itemIndex"
        type="button"
        :class="{ 'is-active': itemIndex === index }"
        :aria-label="`查看第 ${itemIndex + 1} 张推荐图`"
        @click="select(itemIndex)"
      />
    </div>
  </div>
</template>

<style scoped>
.home-advertisement__dots button {
  width: 0.625rem;
  height: 0.625rem;
  padding: 0;
  border: 1px solid var(--cc98-color-text-muted);
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
}

.home-advertisement__dots button.is-active {
  border-color: var(--cc98-color-accent);
  background: var(--cc98-color-accent);
}

.home-advertisement {
  position: relative;
  display: block;
  width: 100%;
  height: 6.25rem;
  overflow: hidden;
}

.home-advertisement img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.home-advertisement__dots {
  position: absolute;
  right: 0.75rem;
  bottom: 0.35rem;
  display: flex;
  gap: 0.35rem;
}

.home-advertisement__dots button {
  border-color: #fff;
  box-shadow: 0 0 0 1px rgb(0 0 0 / 0.22);
}
</style>
