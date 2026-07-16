<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { useRoute, useRouter } from "vue-router";
import { searchTopicsQuery } from "../api/queries";
import PageState from "../components/PageState.vue";
import UiButton from "../components/ui/Button.vue";
import Pagination from "../components/Pagination.vue";
import TopicList from "../components/TopicList.vue";
import { normalizeApiError } from "../lib/api-error";
import { normalizeSearchBoardId, normalizeSearchKeyword, searchTopicsPath } from "../lib/discovery";
import { saveLoginRedirect } from "../lib/login-redirect";
import { pageToFrom, parsePageNumber } from "../lib/route-params";
import { useUserStore } from "../stores/user";

const PAGE_SIZE = 20;
const route = useRoute();
const router = useRouter();
const user = useUserStore();

const draftKeyword = ref("");
const draftBoardId = ref("");

const keyword = computed(() => normalizeSearchKeyword(String(route.query.keyword ?? "")));
const boardId = computed(() => normalizeSearchBoardId(String(route.query.boardId ?? "")));
const currentPage = computed(() => parsePageNumber(String(route.query.page ?? "")));
const from = computed(() => pageToFrom(currentPage.value, PAGE_SIZE));
const authScope = computed(() => user.user?.id ?? "anonymous");
const canSearch = computed(() => user.isLoggedIn && keyword.value.length > 0);

watch(
  () => [route.query.keyword, route.query.boardId] as const,
  () => {
    draftKeyword.value = String(route.query.keyword ?? "");
    draftBoardId.value = boardId.value != null ? String(boardId.value) : "";
  },
  { immediate: true },
);

const options = computed(() =>
  searchTopicsQuery(
    keyword.value,
    boardId.value,
    authScope.value,
    from.value,
    PAGE_SIZE,
    canSearch.value,
  ),
);

const { data: topics, error, isPending, refetch } = useQuery(options);

const pageError = computed(() => {
  if (!user.isLoggedIn) return normalizeApiError({ status: 401 });
  if (error.value) {
    return normalizeApiError(error.value, {
      forbiddenMessage: "搜索过于频繁或无权搜索，请稍后再试",
    });
  }
  return null;
});

const stateKind = computed(() => {
  if (!user.isLoggedIn) return "unauthorized" as const;
  if (!keyword.value) return "empty" as const;
  if (isPending.value) return "loading" as const;
  if (pageError.value?.kind === "forbidden") return "forbidden" as const;
  if (pageError.value?.kind === "not-found") return "not-found" as const;
  if (pageError.value) return "error" as const;
  if ((topics.value?.length ?? 0) === 0) return "empty" as const;
  return null;
});

const emptyMessage = computed(() => {
  if (!keyword.value) return "输入关键词后搜索主题。";
  return "没有找到相关主题。";
});

function submitSearch() {
  const nextKeyword = normalizeSearchKeyword(draftKeyword.value);
  const nextBoardId = normalizeSearchBoardId(draftBoardId.value);
  void router.push(searchTopicsPath(nextKeyword, nextBoardId, 1));
}

function toPage(page: number) {
  return searchTopicsPath(keyword.value, boardId.value, page);
}

function goLogin() {
  saveLoginRedirect(route.fullPath);
  void router.push({ name: "logon" });
}
</script>

<template>
  <section class="space-y-4">
    <header class="space-y-3">
      <h1 class="text-2xl font-bold">搜索主题</h1>
      <form class="flex flex-wrap gap-2 items-end" @submit.prevent="submitSearch">
        <label class="flex flex-col gap-1 text-sm">
          <span class="text-cc98-text-muted">关键词</span>
          <input
            v-model="draftKeyword"
            type="search"
            name="keyword"
            class="cc98-input px-3 py-1.5 min-w-56"
            placeholder="输入关键词"
            autocomplete="off"
          />
        </label>
        <label class="flex flex-col gap-1 text-sm">
          <span class="text-cc98-text-muted">版面 ID（可选）</span>
          <input
            v-model="draftBoardId"
            type="text"
            name="boardId"
            inputmode="numeric"
            class="cc98-input px-3 py-1.5 w-32"
            placeholder="全站"
            autocomplete="off"
          />
        </label>
        <UiButton variant="text" type="submit" size="sm" class="px-2 py-1.5">搜索</UiButton>
        <RouterLink to="/search/boards" class="cc98-link text-sm px-2 py-1.5">搜版面</RouterLink>
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

    <template v-else>
      <Pagination
        :current-page="currentPage"
        :has-next-page="(topics?.length ?? 0) >= PAGE_SIZE"
        :to-page="toPage"
      />
      <div class="cc98-card px-4">
        <TopicList :topics="topics ?? []" />
      </div>
      <Pagination
        :current-page="currentPage"
        :has-next-page="(topics?.length ?? 0) >= PAGE_SIZE"
        :to-page="toPage"
      />
    </template>
  </section>
</template>
