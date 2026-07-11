<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { useRoute, useRouter } from "vue-router";
import { searchBoardsQuery } from "../api/queries";
import PageState from "../components/PageState.vue";
import { normalizeApiError } from "../lib/api-error";
import { normalizeSearchKeyword, searchBoardsPath } from "../lib/discovery";
import { saveLoginRedirect } from "../lib/login-redirect";

const route = useRoute();
const router = useRouter();

const draftKeyword = ref("");
const keyword = computed(() => normalizeSearchKeyword(String(route.query.keyword ?? "")));

watch(
  keyword,
  (value) => {
    draftKeyword.value = value;
  },
  { immediate: true },
);

const options = computed(() => searchBoardsQuery(keyword.value, keyword.value.length > 0));
const { data: boards, error, isPending, refetch } = useQuery(options);

const pageError = computed(() => (error.value ? normalizeApiError(error.value) : null));

const stateKind = computed(() => {
  if (!keyword.value) return "empty" as const;
  if (isPending.value) return "loading" as const;
  if (pageError.value?.kind === "unauthorized") return "unauthorized" as const;
  if (pageError.value?.kind === "forbidden") return "forbidden" as const;
  if (pageError.value?.kind === "not-found") return "not-found" as const;
  if (pageError.value) return "error" as const;
  if ((boards.value?.length ?? 0) === 0) return "empty" as const;
  return null;
});

const emptyMessage = computed(() => {
  if (!keyword.value) return "输入关键词后搜索版面。";
  return "没有找到相关版面。";
});

function submitSearch() {
  void router.push(searchBoardsPath(draftKeyword.value));
}

function goLogin() {
  saveLoginRedirect(route.fullPath);
  void router.push({ name: "logon" });
}
</script>

<template>
  <section class="space-y-4">
    <header class="space-y-3">
      <h1 class="text-2xl font-bold">搜索版面</h1>
      <form class="flex flex-wrap gap-2 items-end" @submit.prevent="submitSearch">
        <label class="flex flex-col gap-1 text-sm">
          <span class="text-cc98-text-muted">关键词</span>
          <input
            v-model="draftKeyword"
            type="search"
            name="keyword"
            class="rounded border border-cc98-border bg-cc98-bg px-3 py-1.5 min-w-56"
            placeholder="版面名称或描述"
            autocomplete="off"
          />
        </label>
        <button type="submit" class="cc98-link text-sm px-2 py-1.5">搜索</button>
        <RouterLink to="/search" class="cc98-link text-sm px-2 py-1.5">搜主题</RouterLink>
      </form>
    </header>

    <PageState
      v-if="stateKind"
      :kind="stateKind"
      :title="stateKind === 'empty' && !keyword ? '开始搜索' : undefined"
      :message="stateKind === 'empty' ? emptyMessage : pageError?.message"
      :show-retry="stateKind === 'error'"
      @login="goLogin"
      @retry="refetch()"
    />

    <div v-else class="cc98-card px-4">
      <ul>
        <li
          v-for="board in boards"
          :key="board.id"
          class="border-b border-cc98-border py-3 last:border-b-0"
        >
          <RouterLink :to="`/list/${board.id}`" class="cc98-link font-medium">
            {{ board.name ?? `版面 ${board.id}` }}
          </RouterLink>
          <p v-if="board.description" class="mt-1 text-sm text-cc98-text-muted line-clamp-2">
            {{ board.description }}
          </p>
          <p class="mt-1 text-xs text-cc98-text-muted">
            主题 {{ board.topicCount ?? "—" }} · 今日 {{ board.todayCount ?? "—" }}
          </p>
        </li>
      </ul>
    </div>
  </section>
</template>
