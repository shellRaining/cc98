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
