<script setup lang="ts">
import type { IndexColumn } from "@cc98/api";
import { isExternalHomepageUrl } from "../../lib/home";
import HomeSectionHeader from "./HomeSectionHeader.vue";

defineProps<{ items: IndexColumn[] }>();
</script>

<template>
  <section v-if="items.length" class="home-sidebar-block">
    <HomeSectionHeader title="福利优惠" tone="secondary" />
    <ul class="home-special-offers">
      <li v-for="item in items" :key="item.id">
        <a
          v-if="isExternalHomepageUrl(item.url)"
          :href="item.url"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ item.title }}
        </a>
        <RouterLink v-else :to="item.url || '/'">{{ item.title }}</RouterLink>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.home-special-offers {
  height: 100%;
  margin: 0;
  padding: 0;
  list-style: none;
}

.home-sidebar-block {
  min-width: 0;
}

.home-special-offers {
  margin-top: 0.75rem;
  padding: 0.75rem 1rem;
  border-top: 8px solid var(--cc98-color-secondary);
  background: var(--cc98-color-surface);
}

.home-special-offers li {
  overflow: hidden;
  padding-block: 0.3rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.home-special-offers li::before {
  content: "• ";
}
</style>
