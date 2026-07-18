<script setup lang="ts">
import type { IndexColumn } from "@cc98/api";
import { isExternalHomepageUrl, normalizeHomepageAssetUrl } from "./model";
import HomeSectionHeader from "./HomeSectionHeader.vue";

defineProps<{ items: IndexColumn[] }>();
</script>

<template>
  <section v-if="items.length" class="home-sidebar-block">
    <HomeSectionHeader title="推荐功能" />
    <div class="home-functions">
      <template v-for="item in items" :key="item.id">
        <a
          v-if="isExternalHomepageUrl(item.url)"
          :href="item.url"
          target="_blank"
          rel="noopener noreferrer"
          class="home-function-link"
        >
          <img
            v-if="normalizeHomepageAssetUrl(item.imageUrl)"
            :src="normalizeHomepageAssetUrl(item.imageUrl) || ''"
            alt=""
          />
          <span>{{ item.title }}</span>
        </a>
        <RouterLink v-else :to="item.url || '/'" class="home-function-link">
          <img
            v-if="normalizeHomepageAssetUrl(item.imageUrl)"
            :src="normalizeHomepageAssetUrl(item.imageUrl) || ''"
            alt=""
          />
          <span>{{ item.title }}</span>
        </RouterLink>
      </template>
    </div>
  </section>
</template>

<style scoped>
.home-sidebar-block {
  min-width: 0;
}

.home-functions {
  margin-top: 0.75rem;
  padding: 1rem 1.25rem;
  background: var(--cc98-color-primary);
}

.home-function-link,
.home-function-link:visited {
  display: flex;
  height: 3.25rem;
  align-items: center;
  gap: 1rem;
  color: #fff;
  font-size: 1rem;
}

.home-function-link:hover {
  color: #fff;
  text-decoration: underline;
}

.home-function-link img {
  width: 2.5rem;
  height: 2.5rem;
  object-fit: contain;
}
</style>
