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
