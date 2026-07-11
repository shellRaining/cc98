<script setup lang="ts">
import { computed, nextTick, watch } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { useRoute, useRouter } from "vue-router";
import dayjs from "dayjs";
import { boardQuery, topicPostsQuery, topicQuery } from "../api/queries";
import PageState from "../components/PageState.vue";
import Pagination from "../components/Pagination.vue";
import PostItem from "../components/PostItem.vue";
import { normalizeApiError } from "../lib/api-error";
import { saveLoginRedirect } from "../lib/login-redirect";
import {
  clampPage,
  normalizeFloorHash,
  pageToFrom,
  parsePageNumber,
  parsePositiveInt,
  topicTotalPages,
} from "../lib/route-params";
import { useUserStore } from "../stores/user";

const props = defineProps<{
  topicId: string;
  page?: string;
}>();

const route = useRoute();
const router = useRouter();
const user = useUserStore();

const PAGE_SIZE = 10;
const numericTopicId = computed(() => parsePositiveInt(props.topicId));
const requestedPage = computed(() => parsePageNumber(props.page));
const invalidId = computed(() => numericTopicId.value == null);
const authScope = computed(() => user.user?.id ?? "anonymous");

const canLoad = computed(() => !invalidId.value && user.isLoggedIn);

const topicOptions = computed(() =>
  topicQuery(numericTopicId.value ?? 0, authScope.value, canLoad.value),
);
const {
  data: topic,
  error: topicError,
  isPending: topicPending,
  refetch: refetchTopic,
} = useQuery(topicOptions);

const totalPages = computed(() => topicTotalPages(topic.value?.replyCount, PAGE_SIZE));
const currentPage = computed(() => clampPage(requestedPage.value, totalPages.value));
const from = computed(() => pageToFrom(currentPage.value, PAGE_SIZE));

watch(
  [requestedPage, totalPages, numericTopicId],
  ([page, total, id]) => {
    if (id == null || total == null) return;
    const clamped = clampPage(page, total);
    if (page !== clamped) {
      void router.replace({
        name: "topic",
        params: {
          topicId: String(id),
          ...(clamped > 1 ? { page: String(clamped) } : {}),
        },
        hash: route.hash,
      });
    }
  },
  { flush: "post" },
);

const boardId = computed(() => topic.value?.boardId ?? null);
const boardOptions = computed(() =>
  boardQuery(boardId.value ?? 0, authScope.value, canLoad.value && boardId.value != null),
);
const { data: board } = useQuery(boardOptions);

const postsOptions = computed(() =>
  topicPostsQuery(
    numericTopicId.value ?? 0,
    authScope.value,
    from.value,
    PAGE_SIZE,
    canLoad.value && topic.value != null,
  ),
);
const {
  data: posts,
  error: postsError,
  isPending: postsPending,
  refetch: refetchPosts,
} = useQuery(postsOptions);

watch(
  [() => route.hash, posts],
  async ([hash]) => {
    const target = normalizeFloorHash(hash);
    if (!target) return;
    await nextTick();
    const el = document.getElementById(target);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  },
  { flush: "post" },
);

const pageError = computed(() => {
  if (invalidId.value) return normalizeApiError({ status: 404 });
  if (!user.isLoggedIn) return normalizeApiError({ status: 401 });
  if (topicError.value) return normalizeApiError(topicError.value);
  if (postsError.value) return normalizeApiError(postsError.value);
  return null;
});

const stateKind = computed(() => {
  if (invalidId.value) return "not-found" as const;
  if (!user.isLoggedIn) return "unauthorized" as const;
  if (topicPending.value) return "loading" as const;
  if (pageError.value?.kind === "unauthorized") return "unauthorized" as const;
  if (pageError.value?.kind === "forbidden") return "forbidden" as const;
  if (pageError.value?.kind === "not-found") return "not-found" as const;
  if (pageError.value) return "error" as const;
  if (postsPending.value) return "loading" as const;
  if ((posts.value?.length ?? 0) === 0) return "empty" as const;
  return null;
});

const topicTitle = computed(() => topic.value?.title?.trim() || `主题 ${props.topicId}`);
const author = computed(() => {
  if (topic.value?.isAnonymous) return "匿名用户";
  return topic.value?.userName?.trim() || "已注销用户";
});
const timeText = computed(() => formatTime(topic.value?.time));

function formatTime(value: string | undefined): string {
  if (!value) return "—";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD HH:mm") : value;
}

function toPage(page: number) {
  return {
    name: "topic" as const,
    params: {
      topicId: props.topicId,
      ...(page > 1 ? { page: String(page) } : {}),
    },
  };
}

function goLogin() {
  saveLoginRedirect(route.fullPath);
  void router.push({ name: "logon" });
}

function retry() {
  void refetchTopic();
  void refetchPosts();
}
</script>

<template>
  <section class="space-y-4">
    <nav class="text-sm text-cc98-text-muted flex flex-wrap gap-1">
      <RouterLink to="/boardlist" class="cc98-link">全部版面</RouterLink>
      <template v-if="board?.id != null">
        <span>/</span>
        <RouterLink :to="`/list/${board.id}`" class="cc98-link">
          {{ board.name ?? `版面 ${board.id}` }}
        </RouterLink>
      </template>
      <span>/</span>
      <span>{{ topicTitle }}</span>
    </nav>

    <PageState
      v-if="stateKind"
      :kind="stateKind"
      :message="pageError?.message"
      :show-retry="stateKind === 'error'"
      @login="goLogin"
      @retry="retry"
    />

    <template v-else-if="topic">
      <header class="space-y-2">
        <h1 class="text-2xl font-bold">{{ topicTitle }}</h1>
        <p class="text-sm text-cc98-text-muted">
          {{ author }} · {{ timeText }} · 回复 {{ topic.replyCount ?? 0 }} · 浏览
          {{ topic.hitCount ?? 0 }}
          <span v-if="(topic.state ?? 0) > 0"> · 已锁定/特殊状态</span>
        </p>
      </header>

      <Pagination :current-page="currentPage" :total-pages="totalPages" :to-page="toPage" />

      <ol class="space-y-4">
        <li v-for="post in posts" :key="post.id ?? post.floor">
          <PostItem :post="post" />
        </li>
      </ol>

      <Pagination :current-page="currentPage" :total-pages="totalPages" :to-page="toPage" />
    </template>
  </section>
</template>
