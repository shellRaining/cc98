<script setup lang="ts">
import type { RecommendedTopic } from "@cc98/api";
import { computed, ref, watch } from "vue";
import { useStorage, useTitle } from "@vueuse/core";
import { useQuery } from "@tanstack/vue-query";
import { useRoute, useRouter } from "vue-router";
import { boardsByIdsQuery, recommendedTopicsQuery, usersByIdsQuery } from "../../api/queries";
import RecommendedTopicItem from "./components/RecommendedTopicItem.vue";
import FullPageStatus from "../../components/FullPageStatus.vue";
import PageState from "../../components/PageState.vue";
import { normalizeApiError } from "../../lib/api-error";
import { uniqueTopicBoardIds, uniqueTopicUserIds } from "./topics";
import { saveLoginRedirect } from "../../lib/login-redirect";
import { useUserStore } from "../../stores/user";

const PAGE_SIZE = 10;

const route = useRoute();
const router = useRouter();
const user = useUserStore();
const refreshToken = ref(0);
const storageScope = user.user?.id ?? "anonymous";
const currentItems = useStorage<RecommendedTopic[]>(`cc98:recommended:${storageScope}:current`, []);
const previousItems = useStorage<RecommendedTopic[]>(
  `cc98:recommended:${storageScope}:previous`,
  [],
);
const shouldFetch = ref(currentItems.value.length === 0);

useTitle("随机精选 - CC98 论坛");

const authScope = computed(() => user.user?.id ?? "anonymous");
const canLoad = computed(() => user.isLoggedIn);
const options = computed(() =>
  recommendedTopicsQuery(
    authScope.value,
    refreshToken.value,
    PAGE_SIZE,
    canLoad.value && shouldFetch.value,
  ),
);
const query = useQuery(options);

watch(
  () => query.data.value,
  (data) => {
    if (!shouldFetch.value || !data) return;
    currentItems.value = data;
    shouldFetch.value = false;
  },
  { immediate: true },
);

const items = computed(() =>
  currentItems.value.filter(
    (item): item is RecommendedTopic & { topic: NonNullable<RecommendedTopic["topic"]> } =>
      item.topic?.id != null,
  ),
);
const topics = computed(() => items.value.map((item) => item.topic));
const boardIds = computed(() => uniqueTopicBoardIds(topics.value));
const authorIds = computed(() => uniqueTopicUserIds(topics.value));
const boardsOptions = computed(() => boardsByIdsQuery(boardIds.value, boardIds.value.length > 0));
const authorsOptions = computed(() => usersByIdsQuery(authorIds.value, authorIds.value.length > 0));
const { data: boards } = useQuery(boardsOptions);
const { data: authors } = useQuery(authorsOptions);
const boardMap = computed(() => new Map((boards.value ?? []).map((board) => [board.id, board])));
const authorMap = computed(
  () => new Map((authors.value ?? []).map((author) => [author.id, author])),
);

const pageError = computed(() => {
  if (!user.isLoggedIn) return normalizeApiError({ status: 401 });
  return query.error.value ? normalizeApiError(query.error.value) : null;
});
const stateKind = computed(() => {
  if (pageError.value?.kind === "unauthorized") return "unauthorized" as const;
  if (shouldFetch.value && query.isPending.value) return "loading" as const;
  if (pageError.value?.kind === "forbidden") return "forbidden" as const;
  if (pageError.value?.kind === "not-found") return "not-found" as const;
  if (pageError.value) return "error" as const;
  if (items.value.length === 0) return "empty" as const;
  return null;
});

function goLogin() {
  saveLoginRedirect(route.fullPath);
  void router.push({ name: "logon" });
}

function refreshBatch() {
  if (query.isFetching.value) return;
  previousItems.value = [...currentItems.value];
  refreshToken.value += 1;
  shouldFetch.value = true;
}

function restorePreviousBatch() {
  if (previousItems.value.length === 0) return;
  currentItems.value = [...previousItems.value];
  previousItems.value = [];
  shouldFetch.value = false;
}
</script>

<template>
  <FullPageStatus v-if="stateKind === 'unauthorized'" kind="unauthorized" @login="goLogin" />
  <section v-else class="recommended-page">
    <nav class="new-topics-breadcrumb" aria-label="当前位置">
      <RouterLink to="/">首页</RouterLink>
      <span>›</span>
      <span>随机精选</span>
    </nav>

    <div class="recommended-actions">
      <button type="button" :disabled="!canLoad || query.isFetching.value" @click="refreshBatch">
        ↻ {{ query.isFetching.value ? "加载中" : "换一换" }}
      </button>
      <button v-if="previousItems.length" type="button" @click="restorePreviousBatch">
        ← 上一批
      </button>
    </div>

    <PageState
      v-if="stateKind"
      :kind="stateKind"
      :message="pageError?.message"
      :show-retry="stateKind === 'error'"
      @login="goLogin"
      @retry="query.refetch()"
    />

    <div v-else class="recommended-topic-list">
      <RecommendedTopicItem
        v-for="item in items"
        :key="item.topic.id"
        :item="item"
        :board="item.topic.boardId ? boardMap.get(item.topic.boardId) : undefined"
        :author="item.topic.userId ? authorMap.get(item.topic.userId) : undefined"
      />
    </div>
  </section>
</template>

<style scoped>
.new-topics-breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  color: var(--cc98-color-text-muted);
  font-size: 1rem;
}

.new-topics-breadcrumb a,
.new-topics-breadcrumb a:visited {
  color: var(--cc98-color-text-muted);
}

.recommended-page {
  width: 100%;
  min-height: 48.75rem;
  margin-bottom: 3.75rem;
}

.recommended-actions {
  display: flex;
  min-height: 1.875rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.recommended-actions button {
  padding: 0.375rem 0.75rem;
  border: 1px solid var(--cc98-color-primary);
  border-radius: 0.25rem;
  background: var(--cc98-color-primary-fill);
  color: #fff;
  font: inherit;
  cursor: pointer;
}

.recommended-actions button:hover {
  background: transparent;
  color: var(--cc98-color-primary);
}

.recommended-actions button:disabled {
  cursor: wait;
  opacity: 0.6;
}

.recommended-topic-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.45rem;
}
</style>
