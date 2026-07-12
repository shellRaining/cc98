<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, type RouteLocationRaw } from "vue-router";
import { paginationWindow } from "../lib/route-params";

const props = withDefaults(
  defineProps<{
    currentPage: number;
    totalPages?: number | null;
    /** 生成目标页路由，返回 string 或 RouteLocationRaw 兼容对象 */
    toPage: (page: number) => RouteLocationRaw;
    /** 总页数未知时，是否仍有下一页 */
    hasNextPage?: boolean;
  }>(),
  {
    totalPages: null,
    hasNextPage: false,
  },
);

const knownTotal = computed(() =>
  props.totalPages != null && props.totalPages > 0 ? props.totalPages : null,
);

const windowPages = computed(() =>
  knownTotal.value ? paginationWindow(props.currentPage, knownTotal.value) : [],
);

const canPrev = computed(() => props.currentPage > 1);
const canNext = computed(() => {
  if (knownTotal.value != null) return props.currentPage < knownTotal.value;
  return props.hasNextPage;
});
</script>

<template>
  <nav
    v-if="knownTotal != null || canPrev || canNext"
    class="flex flex-wrap items-center gap-2 text-sm"
    aria-label="分页"
  >
    <RouterLink v-if="canPrev" :to="toPage(1)" class="cc98-link"> 首页 </RouterLink>
    <RouterLink v-if="canPrev" :to="toPage(currentPage - 1)" class="cc98-link" rel="prev">
      上一页
    </RouterLink>

    <template v-if="knownTotal != null">
      <template v-for="(item, index) in windowPages" :key="`${item}-${index}`">
        <span v-if="item == null" class="text-cc98-text-muted">…</span>
        <RouterLink
          v-else
          :to="toPage(item)"
          class="cc98-link px-1"
          :aria-current="item === currentPage ? 'page' : undefined"
          :class="item === currentPage ? 'font-semibold text-cc98-primary' : ''"
        >
          {{ item }}
        </RouterLink>
      </template>
      <span class="text-cc98-text-muted">/ {{ knownTotal }}</span>
    </template>

    <RouterLink v-if="canNext" :to="toPage(currentPage + 1)" class="cc98-link" rel="next">
      下一页
    </RouterLink>
    <RouterLink v-if="knownTotal != null && canNext" :to="toPage(knownTotal)" class="cc98-link">
      末页
    </RouterLink>
  </nav>
</template>
