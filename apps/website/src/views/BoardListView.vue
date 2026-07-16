<script setup lang="ts">
import { computed } from "vue";
import { useTitle } from "@vueuse/core";
import { useQuery } from "@tanstack/vue-query";
import { boardsQuery } from "../api/queries";
import BoardListGroup from "../components/board/BoardListGroup.vue";
import PageState from "../components/PageState.vue";
import { boardGroupAnchor } from "../lib/board-list";

useTitle("版面列表 - CC98 论坛", { restoreOnUnmount: true });

const { data, error, isPending, refetch } = useQuery(boardsQuery);

const boardGroups = computed(() =>
  [...(data.value ?? [])].sort((left, right) => (left.order ?? 0) - (right.order ?? 0)),
);
</script>

<template>
  <PageState v-if="isPending" kind="loading" />
  <PageState
    v-else-if="error"
    kind="error"
    message="版面列表加载失败，请稍后重试。"
    show-retry
    @retry="refetch()"
  />
  <PageState v-else-if="boardGroups.length === 0" kind="empty" message="暂时没有可浏览的版面。" />

  <section v-else class="board-list-page">
    <div class="board-list-page__groups">
      <BoardListGroup v-for="group in boardGroups" :key="group.id ?? group.name" :group="group" />
    </div>

    <nav class="board-list-guide" aria-label="版面分区快速导航">
      <a
        v-for="group in boardGroups"
        :key="group.id ?? group.name"
        :href="`#${boardGroupAnchor(group.id)}`"
      >
        {{ group.name }}
      </a>
    </nav>
  </section>
</template>
