<script setup lang="ts">
import { computed, watch } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { useRoute, useRouter } from "vue-router";
import { boardQuery, boardTopicsQuery, boardTopTopicsQuery } from "../api/queries";
import PageState from "../components/PageState.vue";
import Pagination from "../components/Pagination.vue";
import TopicList from "../components/TopicList.vue";
import { normalizeApiError } from "../lib/api-error";
import { saveLoginRedirect } from "../lib/login-redirect";
import {
  boardPagePath,
  boardTotalPages,
  clampPage,
  pageToFrom,
  parsePositiveInt,
  resolveBoardPage,
} from "../lib/route-params";
import { useUserStore } from "../stores/user";
import { useFollowBoardMutation, useUnfollowBoardMutation } from "../api/mutations";
import UiButton from "../components/ui/Button.vue";

const props = defineProps<{
  boardId: string;
  type?: string;
  page?: string;
}>();

const route = useRoute();
const router = useRouter();
const user = useUserStore();
const followBoard = useFollowBoardMutation();
const unfollowBoard = useUnfollowBoardMutation();
const relationPending = computed(
  () => followBoard.isPending.value || unfollowBoard.isPending.value,
);

const PAGE_SIZE = 20;
const numericBoardId = computed(() => parsePositiveInt(props.boardId));
const requestedPage = computed(() => resolveBoardPage(props.type, props.page));
const invalidId = computed(() => numericBoardId.value == null);
const authScope = computed(() => user.user?.id ?? "anonymous");

const boardOptions = computed(() =>
  boardQuery(numericBoardId.value ?? 0, authScope.value, !invalidId.value),
);
const {
  data: board,
  error: boardError,
  isPending: boardPending,
  refetch: refetchBoard,
} = useQuery(boardOptions);

const needLoginForEntry = computed(() => board.value?.canEntry === false && !user.isLoggedIn);
const forbiddenEntry = computed(() => board.value?.canEntry === false && user.isLoggedIn);

const canLoadTopics = computed(
  () =>
    !invalidId.value && user.isLoggedIn && board.value != null && board.value.canEntry !== false,
);

const totalPages = computed(() => boardTotalPages(board.value?.topicCount, PAGE_SIZE));
const currentPage = computed(() => clampPage(requestedPage.value, totalPages.value));
const from = computed(() => pageToFrom(currentPage.value, PAGE_SIZE));

watch(
  [requestedPage, totalPages, numericBoardId],
  ([page, total, id]) => {
    if (id == null || total == null) return;
    const clamped = clampPage(page, total);
    if (page !== clamped) {
      void router.replace(boardPagePath(id, clamped));
    }
  },
  { flush: "post" },
);

const topicsOptions = computed(() =>
  boardTopicsQuery(
    numericBoardId.value ?? 0,
    authScope.value,
    from.value,
    PAGE_SIZE,
    canLoadTopics.value,
  ),
);
const topOptions = computed(() =>
  boardTopTopicsQuery(
    numericBoardId.value ?? 0,
    authScope.value,
    canLoadTopics.value && currentPage.value === 1,
  ),
);

const {
  data: topics,
  error: topicsError,
  isPending: topicsPending,
  refetch: refetchTopics,
} = useQuery(topicsOptions);

const {
  data: topTopics,
  error: topError,
  isPending: topPending,
  refetch: refetchTop,
} = useQuery(topOptions);

const pinnedIds = computed(() => {
  const ids = new Set<number>();
  for (const topic of topTopics.value ?? []) {
    if (topic.id != null) ids.add(topic.id);
  }
  return ids;
});

const mergedTopics = computed(() => {
  const normals = topics.value ?? [];
  if (currentPage.value !== 1) return normals;
  const tops = topTopics.value ?? [];
  const seen = new Set<number>();
  const result = [];
  for (const topic of [...tops, ...normals]) {
    if (topic.id == null) {
      result.push(topic);
      continue;
    }
    if (seen.has(topic.id)) continue;
    seen.add(topic.id);
    result.push(topic);
  }
  return result;
});

const listPending = computed(
  () =>
    canLoadTopics.value && (topicsPending.value || (currentPage.value === 1 && topPending.value)),
);

const pageError = computed(() => {
  if (invalidId.value) return normalizeApiError({ status: 404 });
  if (boardError.value) return normalizeApiError(boardError.value);
  if (needLoginForEntry.value) return normalizeApiError({ status: 401 });
  if (forbiddenEntry.value) return normalizeApiError({ status: 403 });
  if (!user.isLoggedIn && !boardPending.value && board.value) {
    // 版面信息可匿名，但主题列表需要登录
    return normalizeApiError({ status: 401 });
  }
  if (topicsError.value) return normalizeApiError(topicsError.value);
  if (topError.value && currentPage.value === 1) return normalizeApiError(topError.value);
  return null;
});

const stateKind = computed(() => {
  if (invalidId.value) return "not-found" as const;
  if (boardPending.value) return "loading" as const;
  if (pageError.value?.kind === "unauthorized") return "unauthorized" as const;
  if (pageError.value?.kind === "forbidden") return "forbidden" as const;
  if (pageError.value?.kind === "not-found") return "not-found" as const;
  if (pageError.value) return "error" as const;
  if (listPending.value) return "loading" as const;
  if (canLoadTopics.value && mergedTopics.value.length === 0) return "empty" as const;
  return null;
});

function toPage(page: number) {
  return boardPagePath(props.boardId, page);
}

function goLogin() {
  saveLoginRedirect(route.fullPath);
  void router.push({ name: "logon" });
}

function retry() {
  void refetchBoard();
  if (canLoadTopics.value) {
    void refetchTopics();
    if (currentPage.value === 1) void refetchTop();
  }
}

function toggleBoardFollow() {
  const id = numericBoardId.value;
  if (!id || relationPending.value) return;
  if (!user.isLoggedIn) {
    goLogin();
    return;
  }
  if (board.value?.isUserCustomBoard) unfollowBoard.mutate(id);
  else followBoard.mutate(id);
}
</script>

<template>
  <section class="space-y-4">
    <nav class="text-sm text-cc98-text-muted">
      <RouterLink to="/boardlist" class="cc98-link">全部版面</RouterLink>
      <span v-if="board?.name"> / {{ board.name }}</span>
    </nav>

    <PageState
      v-if="stateKind"
      :kind="stateKind"
      :message="pageError?.message"
      :show-retry="stateKind === 'error'"
      @login="goLogin"
      @retry="retry"
    />

    <template v-else-if="board">
      <header class="space-y-2">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h1 class="text-2xl font-bold">{{ board.name ?? `版面 ${boardId}` }}</h1>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="rounded border border-cc98-border px-4 py-2 text-sm disabled:opacity-50"
              :disabled="relationPending"
              @click="toggleBoardFollow"
            >
              {{ board.isUserCustomBoard ? "取消关注" : "关注版面" }}
            </button>
            <UiButton as-child size="sm">
              <RouterLink :to="{ name: 'create-topic', params: { boardId } }"> 发主题 </RouterLink>
            </UiButton>
          </div>
        </div>
        <p
          v-if="followBoard.error.value || unfollowBoard.error.value"
          class="text-sm text-cc98-accent"
        >
          {{ normalizeApiError(followBoard.error.value ?? unfollowBoard.error.value).message }}
        </p>
        <p v-if="board.description" class="text-sm text-cc98-text-muted whitespace-pre-wrap">
          {{ board.description }}
        </p>
        <p class="text-xs text-cc98-text-muted">
          主题 {{ board.topicCount ?? "—" }} · 帖数 {{ board.postCount ?? "—" }} · 今日
          {{ board.todayCount ?? "—" }}
        </p>
      </header>

      <Pagination
        :current-page="currentPage"
        :total-pages="totalPages"
        :has-next-page="(topics?.length ?? 0) >= PAGE_SIZE"
        :to-page="toPage"
      />

      <div class="cc98-card px-4">
        <TopicList :topics="mergedTopics" :pinned-ids="pinnedIds" :show-board="false" />
      </div>

      <Pagination
        :current-page="currentPage"
        :total-pages="totalPages"
        :has-next-page="(topics?.length ?? 0) >= PAGE_SIZE"
        :to-page="toPage"
      />
    </template>
  </section>
</template>
