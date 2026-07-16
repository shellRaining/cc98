<script setup lang="ts">
import type { IndexColumn } from "@cc98/api";
import { isExternalHomepageUrl, normalizeHomepageAssetUrl } from "../../lib/home";
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
