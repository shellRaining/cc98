<script setup lang="ts">
import { computed } from "vue";
import { useTitle } from "@vueuse/core";
import { useQuery } from "@tanstack/vue-query";
import { useRoute } from "vue-router";
import { searchBoardsQuery } from "../api/queries";
import PageState from "../components/PageState.vue";
import { normalizeApiError } from "../lib/api-error";
import { normalizeSearchKeyword } from "../lib/discovery";

const route = useRoute();

useTitle("搜索结果 - CC98 论坛");

const keyword = computed(() => normalizeSearchKeyword(String(route.query.keyword ?? "")));
const options = computed(() => searchBoardsQuery(keyword.value, keyword.value.length > 0));
const { data: boards, error, isPending, refetch } = useQuery(options);
const pageError = computed(() => (error.value ? normalizeApiError(error.value) : null));
const stateKind = computed(() => {
  if (!keyword.value) return "empty" as const;
  if (isPending.value) return "loading" as const;
  if (pageError.value?.kind === "forbidden") return "forbidden" as const;
  if (pageError.value?.kind === "not-found") return "not-found" as const;
  if (pageError.value) return "error" as const;
  if ((boards.value?.length ?? 0) === 0) return "empty" as const;
  return null;
});
</script>

<template>
  <section class="search-page">
    <nav class="new-topics-breadcrumb" aria-label="当前位置">
      <RouterLink to="/">首页</RouterLink>
      <span>›</span>
      <RouterLink to="/boardlist">版面列表</RouterLink>
      <span>›</span>
      <span>搜索版面</span>
    </nav>

    <p v-if="keyword" class="search-summary">搜索版面“{{ keyword }}”</p>

    <PageState
      v-if="stateKind && stateKind !== 'empty'"
      :kind="stateKind"
      :message="pageError?.message"
      :show-retry="stateKind === 'error'"
      @retry="refetch()"
    />

    <div v-else-if="stateKind === 'empty'" class="search-empty">
      <p>
        {{ keyword ? "抱歉呢前辈，没有找到你想要的版面哦~" : "请在顶部搜索框输入版面关键词。" }}
      </p>
    </div>

    <div v-else class="search-board-results">
      <RouterLink v-for="board in boards" :key="board.id" :to="`/list/${board.id}`">
        {{ board.name ?? `版面 ${board.id}` }}
      </RouterLink>
    </div>
  </section>
</template>
