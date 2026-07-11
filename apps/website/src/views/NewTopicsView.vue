<script setup lang="ts">
import { computed } from "vue";
import { useInfiniteQuery } from "@tanstack/vue-query";
import { useRoute, useRouter } from "vue-router";
import { newTopicsInfiniteQuery } from "../api/queries";
import LoadMore from "../components/LoadMore.vue";
import PageState from "../components/PageState.vue";
import TopicList from "../components/TopicList.vue";
import { normalizeApiError } from "../lib/api-error";
import { dedupeTopicsById } from "../lib/discovery";
import { saveLoginRedirect } from "../lib/login-redirect";
import { useUserStore } from "../stores/user";

const PAGE_SIZE = 20;
const route = useRoute();
const router = useRouter();
const user = useUserStore();

const authScope = computed(() => user.user?.id ?? "anonymous");
const canLoad = computed(() => user.isLoggedIn);

const options = computed(() => newTopicsInfiniteQuery(authScope.value, PAGE_SIZE, canLoad.value));

const { data, error, isPending, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } =
  useInfiniteQuery(options);

const topics = computed(() => dedupeTopicsById(data.value?.pages.flatMap((page) => page) ?? []));

const pageError = computed(() => {
  if (!user.isLoggedIn) return normalizeApiError({ status: 401 });
  if (error.value) return normalizeApiError(error.value);
  return null;
});

const stateKind = computed(() => {
  if (pageError.value?.kind === "unauthorized") return "unauthorized" as const;
  if (isPending.value) return "loading" as const;
  if (pageError.value?.kind === "forbidden") return "forbidden" as const;
  if (pageError.value?.kind === "not-found") return "not-found" as const;
  if (pageError.value) return "error" as const;
  if (topics.value.length === 0) return "empty" as const;
  return null;
});

function goLogin() {
  saveLoginRedirect(route.fullPath);
  void router.push({ name: "logon" });
}

function loadMore() {
  if (!hasNextPage.value || isFetchingNextPage.value) return;
  void fetchNextPage();
}
</script>

<template>
  <section class="space-y-4">
    <header>
      <h1 class="text-2xl font-bold">新帖</h1>
      <p class="mt-1 text-sm text-cc98-text-muted">全站最新主题，按时间倒序。</p>
    </header>

    <PageState
      v-if="stateKind"
      :kind="stateKind"
      :message="pageError?.message"
      :show-retry="stateKind === 'error'"
      @login="goLogin"
      @retry="refetch()"
    />

    <template v-else>
      <div class="cc98-card px-4">
        <TopicList :topics="topics" />
      </div>
      <LoadMore
        :has-more="Boolean(hasNextPage)"
        :loading="isFetchingNextPage"
        @load-more="loadMore"
      />
    </template>
  </section>
</template>
