<script setup lang="ts">
import { computed } from "vue";
import { useTitle, useWindowScroll } from "@vueuse/core";
import { useInfiniteQuery, useQuery } from "@tanstack/vue-query";
import { useRoute, useRouter } from "vue-router";
import {
  boardsByIdsQuery,
  globalTagsQuery,
  searchTopicsInfiniteQuery,
  usersByIdsQuery,
} from "../api/queries";
import NewTopicClassicItem from "../components/discovery/NewTopicClassicItem.vue";
import PageState from "../components/PageState.vue";
import { normalizeApiError } from "../lib/api-error";
import {
  dedupeTopicsById,
  normalizeSearchBoardId,
  normalizeSearchKeyword,
  uniqueTopicBoardIds,
  uniqueTopicUserIds,
} from "../lib/discovery";
import { saveLoginRedirect } from "../lib/login-redirect";
import { useUserStore } from "../stores/user";

const PAGE_SIZE = 20;

const route = useRoute();
const router = useRouter();
const user = useUserStore();
const { y } = useWindowScroll({ behavior: "smooth" });

useTitle("搜索结果 - CC98 论坛");

const keyword = computed(() => normalizeSearchKeyword(String(route.query.keyword ?? "")));
const boardId = computed(() => normalizeSearchBoardId(String(route.query.boardId ?? "")));
const authScope = computed(() => user.user?.id ?? "anonymous");
const canSearch = computed(() => user.isLoggedIn && keyword.value.length > 0);
const options = computed(() =>
  searchTopicsInfiniteQuery(
    keyword.value,
    boardId.value,
    authScope.value,
    PAGE_SIZE,
    canSearch.value,
  ),
);
const query = useInfiniteQuery(options);
const topics = computed(() =>
  dedupeTopicsById(query.data.value?.pages.flatMap((page) => page) ?? []),
);

const boardIds = computed(() => uniqueTopicBoardIds(topics.value));
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

const pageError = computed(() => {
  if (!user.isLoggedIn) return normalizeApiError({ status: 401 });
  return query.error.value
    ? normalizeApiError(query.error.value, {
        forbiddenMessage: "搜索过于频繁或无权搜索，请稍后再试",
      })
    : null;
});
const stateKind = computed(() => {
  if (pageError.value?.kind === "unauthorized") return "unauthorized" as const;
  if (!keyword.value) return "empty" as const;
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

function loadMore() {
  if (!query.hasNextPage.value || query.isFetchingNextPage.value) return;
  void query.fetchNextPage();
}

function goLogin() {
  saveLoginRedirect(route.fullPath);
  void router.push({ name: "logon" });
}
</script>

<template>
  <section class="search-page">
    <nav class="new-topics-breadcrumb" aria-label="当前位置">
      <RouterLink to="/">首页</RouterLink>
      <span>›</span>
      <span>搜索主题</span>
    </nav>

    <p v-if="keyword" class="search-summary">
      {{ boardId ? `版内搜索“${keyword}”` : `全站搜索“${keyword}”` }}
    </p>

    <PageState
      v-if="stateKind && stateKind !== 'empty'"
      :kind="stateKind"
      :message="pageError?.message"
      :show-retry="stateKind === 'error'"
      @login="goLogin"
      @retry="query.refetch()"
    />

    <div v-else-if="stateKind === 'empty'" class="search-empty">
      <p>
        {{ keyword ? "抱歉呢前辈，没有找到你想要的帖子哦~" : "请在顶部搜索框输入关键词。" }}
      </p>
    </div>

    <template v-else>
      <div class="search-topic-list">
        <NewTopicClassicItem
          v-for="topic in topics"
          :key="topic.id"
          :topic="topic"
          :board="topic.boardId ? boardMap.get(topic.boardId) : undefined"
          :author="topic.userId ? authorMap.get(topic.userId) : undefined"
          :tag-names="topicTags(topic)"
        />
      </div>
      <button
        v-if="query.hasNextPage.value"
        type="button"
        class="search-load-more"
        :disabled="query.isFetchingNextPage.value"
        @click="loadMore"
      >
        <span>{{ query.isFetchingNextPage.value ? "正在加载" : "点击获取更多搜索结果~" }}</span>
        <span>······</span>
      </button>
      <p v-else class="search-end">没有更多帖子啦~</p>
    </template>

    <button v-if="y > 234" type="button" class="new-topics-to-top" @click="y = 0">回到顶部</button>
  </section>
</template>
