<script setup lang="ts">
import type { IndexColumn } from "@cc98/api";
import { computed, onMounted } from "vue";
import { useCarouselIndex } from "../../composables/useCarouselIndex";
import { isExternalHomepageUrl, normalizeHomepageAssetUrl } from "../../lib/home";
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
