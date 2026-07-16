<script setup lang="ts">
import { computed, ref } from "vue";
import { useIntersectionObserver, useTitle, useWindowScroll } from "@vueuse/core";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/vue-query";
import { useRoute, useRouter } from "vue-router";
import {
  boardsByIdsQuery,
  currentUserQuery,
  focusTopicsInfiniteQuery,
  globalTagsQuery,
  usersByIdsQuery,
} from "../api/queries";
import NewTopicClassicItem from "../components/discovery/NewTopicClassicItem.vue";
import LoadMore from "../components/LoadMore.vue";
import PageState from "../components/PageState.vue";
import { normalizeApiError } from "../lib/api-error";
import {
  dedupeTopicsById,
  focusPath,
  resolveFocusBoardId,
  resolveFocusMode,
  uniqueTopicBoardIds,
  uniqueTopicUserIds,
  type FocusMode,
} from "../lib/discovery";
import { saveLoginRedirect } from "../lib/login-redirect";
import { useUserStore } from "../stores/user";

const PAGE_SIZE = 20;

const route = useRoute();
const router = useRouter();
const user = useUserStore();
const queryClient = useQueryClient();
const loadMoreTarget = ref<HTMLElement | null>(null);
const { y } = useWindowScroll({ behavior: "smooth" });

useTitle("我的关注 - CC98 论坛");

const authScope = computed(() => user.user?.id ?? "anonymous");
const mode = computed(() => resolveFocusMode(route.meta.focusMode));
const selectedBoardId = computed(() =>
  mode.value === "board" ? resolveFocusBoardId(route.query.boardId) : 0,
);
const { data: me } = useQuery({ ...currentUserQuery, enabled: () => user.isLoggedIn });
const customBoardIds = computed(() => me.value?.customBoards ?? []);
const customBoardsOptions = computed(() =>
  boardsByIdsQuery(customBoardIds.value, customBoardIds.value.length > 0),
);
const { data: customBoards } = useQuery(customBoardsOptions);

const options = computed(() =>
  focusTopicsInfiniteQuery(
    mode.value,
    selectedBoardId.value,
    authScope.value,
    PAGE_SIZE,
    user.isLoggedIn,
  ),
);
const query = useInfiniteQuery(options);
const topics = computed(() =>
  dedupeTopicsById(query.data.value?.pages.flatMap((page) => page) ?? []),
);

const boardIds = computed(() => [
  ...new Set([...customBoardIds.value, ...uniqueTopicBoardIds(topics.value)]),
]);
const authorIds = computed(() => uniqueTopicUserIds(topics.value));
const boardsOptions = computed(() => boardsByIdsQuery(boardIds.value, boardIds.value.length > 0));
const authorsOptions = computed(() => usersByIdsQuery(authorIds.value, authorIds.value.length > 0));
const { data: boards } = useQuery(boardsOptions);
const { data: authors } = useQuery(authorsOptions);
const { data: tags } = useQuery(globalTagsQuery);
const boardMap = computed(() => new Map((boards.value ?? []).map((board) => [board.id, board])));
const authorMap = computed(
  () => new Map((authors.value ?? []).map((author) => [author.id, author])),
);
const tagMap = computed(() => new Map((tags.value ?? []).map((tag) => [tag.id, tag.name])));
const orderedCustomBoards = computed(() =>
  customBoardIds.value.flatMap((id) => {
    const board = boardMap.value.get(id);
    return board ? [board] : [];
  }),
);

const pageError = computed(() => {
  if (!user.isLoggedIn) return normalizeApiError({ status: 401 });
  return query.error.value ? normalizeApiError(query.error.value) : null;
});
const stateKind = computed(() => {
  if (pageError.value?.kind === "unauthorized") return "unauthorized" as const;
  if (query.isPending.value) return "loading" as const;
  if (pageError.value?.kind === "forbidden") return "forbidden" as const;
  if (pageError.value?.kind === "not-found") return "not-found" as const;
  if (pageError.value) return "error" as const;
  if (topics.value.length === 0) return "empty" as const;
  return null;
});

function topicTags(topic: { tag1?: number | null; tag2?: number | null }) {
  return [topic.tag1, topic.tag2].flatMap((id) =>
    id != null && id > 0 ? [tagMap.value.get(id) || String(id)] : [],
  );
}

function switchBoard(boardId: number) {
  if (boardId === selectedBoardId.value) return;
  void router.push(focusPath("board", boardId));
}

function enterBoard(boardId: number) {
  if (boardId <= 0) return;
  void router.push(`/list/${boardId}`);
}

function refresh() {
  void queryClient.resetQueries({ queryKey: options.value.queryKey, exact: true });
}

function goLogin() {
  saveLoginRedirect(route.fullPath);
  void router.push({ name: "logon" });
}

function loadMore() {
  if (!query.hasNextPage.value || query.isFetchingNextPage.value) return;
  void query.fetchNextPage();
}

useIntersectionObserver(
  loadMoreTarget,
  ([entry]) => {
    if (entry?.isIntersecting) loadMore();
  },
  { rootMargin: "240px 0px" },
);
</script>

<template>
  <section class="focus-page">
    <nav class="focus-tabs" aria-label="关注分类">
      <RouterLink
        v-for="item in [
          { mode: 'board' as FocusMode, label: '关注版面' },
          { mode: 'user' as FocusMode, label: '关注用户' },
          { mode: 'favorite' as FocusMode, label: '收藏更新' },
        ]"
        :key="item.mode"
        :to="focusPath(item.mode)"
        :class="{ 'is-active': mode === item.mode }"
      >
        {{ item.label }}
      </RouterLink>
      <button type="button" :disabled="query.isFetching.value" @click="refresh">
        ↻ {{ query.isFetching.value ? "刷新中" : "刷新" }}
      </button>
    </nav>

    <div v-if="mode === 'board'" class="focus-board-picker">
      <button type="button" :class="{ 'is-active': selectedBoardId === 0 }" @click="switchBoard(0)">
        全部帖子
      </button>
      <button
        v-for="board in orderedCustomBoards"
        :key="board.id"
        type="button"
        :class="{ 'is-active': selectedBoardId === board.id }"
        @click="switchBoard(board.id)"
        @dblclick="enterBoard(board.id)"
      >
        {{ board.name }}
      </button>
      <p>提示：单击版面标签可切换下方展示内容，双击可直接进入版面</p>
    </div>

    <PageState
      v-if="stateKind"
      :kind="stateKind"
      :message="
        stateKind === 'empty'
          ? mode === 'favorite'
            ? '收藏的主题暂时没有更新。'
            : '关注内容暂时没有更新。'
          : pageError?.message
      "
      :show-retry="stateKind === 'error'"
      @login="goLogin"
      @retry="query.refetch()"
    />

    <template v-else>
      <div class="focus-topic-list">
        <NewTopicClassicItem
          v-for="topic in topics"
          :key="topic.id"
          :topic="topic"
          :board="topic.boardId ? boardMap.get(topic.boardId) : undefined"
          :author="topic.userId ? authorMap.get(topic.userId) : undefined"
          :tag-names="topicTags(topic)"
        />
      </div>
      <div ref="loadMoreTarget" class="focus-load-more-target">
        <LoadMore
          :has-more="Boolean(query.hasNextPage.value)"
          :loading="query.isFetchingNextPage.value"
          exhausted-message="无法加载更多了，小水怡情，可不要沉迷哦~"
          @load-more="loadMore"
        />
      </div>
    </template>

    <button v-if="y > 234" type="button" class="new-topics-to-top" @click="y = 0">回到顶部</button>
  </section>
</template>
