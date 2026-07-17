<script setup lang="ts">
import { computed, ref } from "vue";
import { useTitle, useWindowScroll } from "@vueuse/core";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/vue-query";
import { useRoute, useRouter } from "vue-router";
import { useSetTopicViewModeMutation } from "../api/mutations";
import {
  boardsByIdsQuery,
  currentUserQuery,
  globalTagsQuery,
  newTopicsInfiniteQuery,
  recommendedTopicsQuery,
  usersByIdsQuery,
} from "../api/queries";
import NewTopicCard from "../components/discovery/NewTopicCard.vue";
import NewTopicClassicItem from "../components/discovery/NewTopicClassicItem.vue";
import FullPageStatus from "../components/FullPageStatus.vue";
import LoadMore from "../components/LoadMore.vue";
import PageState from "../components/PageState.vue";
import { normalizeApiError } from "../lib/api-error";
import {
  dedupeTopicsById,
  newTopicsPath,
  newTopicViewPreference,
  resolveNewTopicViewMode,
  uniqueTopicBoardIds,
  uniqueTopicUserIds,
  type NewTopicViewMode,
} from "../lib/discovery";
import { saveLoginRedirect } from "../lib/login-redirect";
import { useUserStore } from "../stores/user";

const PAGE_SIZE = 20;
const route = useRoute();
const router = useRouter();
const user = useUserStore();
const queryClient = useQueryClient();
const setTopicViewMode = useSetTopicViewModeMutation();
const showProfile = ref(true);
const { y } = useWindowScroll({ behavior: "smooth" });

useTitle("查看新帖 - CC98 论坛");

const authScope = computed(() => user.user?.id ?? "anonymous");
const canLoad = computed(() => user.isLoggedIn);
const { data: me } = useQuery({ ...currentUserQuery, enabled: () => user.isLoggedIn });
const viewMode = computed(() =>
  resolveNewTopicViewMode(route.query.view, me.value?.topicViewMode ?? 0),
);
const queryMode = computed(() => (viewMode.value === "media" ? "media" : "all"));
const options = computed(() =>
  newTopicsInfiniteQuery(queryMode.value, authScope.value, PAGE_SIZE, canLoad.value),
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

const customBoardIds = computed(() => me.value?.customBoards ?? []);
const customBoardsOptions = computed(() =>
  boardsByIdsQuery(customBoardIds.value, customBoardIds.value.length > 0),
);
const { data: customBoards } = useQuery(customBoardsOptions);
const recommendationsOptions = computed(() =>
  recommendedTopicsQuery(authScope.value, 0, 6, canLoad.value && viewMode.value !== "classic"),
);
const { data: recommendations } = useQuery(recommendationsOptions);
const recommendedTopics = computed(() =>
  (recommendations.value ?? []).flatMap((item) => (item.topic ? [item.topic] : [])),
);

const pageError = computed(() => {
  if (!user.isLoggedIn) return normalizeApiError({ status: 401 });
  if (query.error.value) return normalizeApiError(query.error.value);
  return null;
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

function switchMode(mode: NewTopicViewMode) {
  if (mode === viewMode.value) return;
  void router.push(newTopicsPath(mode));
  setTopicViewMode.mutate(newTopicViewPreference(mode));
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

function formatCount(value: number | undefined) {
  if (value == null) return "—";
  if (value >= 100_000) return `${Math.floor(value / 10_000)}万`;
  if (value >= 10_000) return `${(Math.floor(value / 1000) / 10).toFixed(1)}万`;
  return String(value);
}
</script>

<template>
  <FullPageStatus v-if="stateKind === 'unauthorized'" kind="unauthorized" @login="goLogin" />
  <section v-else class="new-topics-page">
    <nav class="new-topics-breadcrumb" aria-label="当前位置">
      <RouterLink to="/">首页</RouterLink>
      <span>›</span>
      <span>查看新帖</span>
    </nav>

    <div class="new-topics-toolbar">
      <div class="new-topics-toolbar__modes" aria-label="新帖视图">
        <button
          type="button"
          :class="{ 'is-active': viewMode === 'classic' }"
          @click="switchMode('classic')"
        >
          经典模式
        </button>
        <button
          type="button"
          :class="{ 'is-active': viewMode === 'card' }"
          @click="switchMode('card')"
        >
          卡片模式
        </button>
        <button
          type="button"
          :class="{ 'is-active': viewMode === 'media' }"
          @click="switchMode('media')"
        >
          只看媒体
        </button>
      </div>
      <button
        type="button"
        class="new-topics-refresh"
        :disabled="query.isFetching.value"
        @click="refresh"
      >
        ↻ {{ query.isFetching.value ? "刷新中" : "刷新" }}
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

    <template v-else>
      <div v-if="viewMode === 'classic'" class="new-topic-classic-list">
        <NewTopicClassicItem
          v-for="topic in topics"
          :key="topic.id"
          :topic="topic"
          :board="topic.boardId ? boardMap.get(topic.boardId) : undefined"
          :author="topic.userId ? authorMap.get(topic.userId) : undefined"
          :tag-names="topicTags(topic)"
        />
      </div>

      <div v-else class="new-topic-card-layout">
        <aside class="new-topic-card-layout__left">
          <section class="new-topic-profile-card">
            <div class="new-topic-profile-card__background" />
            <div class="new-topic-profile-card__identity">
              <img
                :src="
                  showProfile
                    ? me?.portraitUrl || '/static/images/default_avatar_boy.png'
                    : '/static/images/_心灵之约.png'
                "
                alt=""
              />
              <RouterLink to="/usercenter">{{ showProfile ? me?.name : "隐私模式" }}</RouterLink>
              <button
                type="button"
                :aria-label="showProfile ? '隐藏个人信息' : '显示个人信息'"
                @click="showProfile = !showProfile"
              >
                {{ showProfile ? "隐藏" : "显示" }}
              </button>
            </div>
            <dl class="new-topic-profile-card__stats">
              <div>
                <dd>{{ showProfile ? formatCount(me?.postCount) : "--" }}</dd>
                <dt>帖数</dt>
              </div>
              <div>
                <dd>{{ showProfile ? formatCount(me?.followCount) : "--" }}</dd>
                <dt>关注</dt>
              </div>
              <div>
                <dd>{{ showProfile ? formatCount(me?.fanCount) : "--" }}</dd>
                <dt>粉丝</dt>
              </div>
              <div>
                <dd>{{ showProfile ? formatCount(me?.receivedLikeCount) : "--" }}</dd>
                <dt>获赞</dt>
              </div>
            </dl>
          </section>
          <section class="new-topic-board-card">
            <h2>版面列表</h2>
            <ul v-if="customBoards?.length">
              <li v-for="board in customBoards" :key="board.id">
                <RouterLink :to="`/list/${board.id}`">{{ board.name }}</RouterLink>
              </li>
            </ul>
            <p v-else>暂无自定义版面</p>
          </section>
        </aside>

        <div class="new-topic-card-layout__middle">
          <NewTopicCard
            v-for="topic in topics"
            :key="topic.id"
            :topic="topic"
            :board="topic.boardId ? boardMap.get(topic.boardId) : undefined"
            :author="topic.userId ? authorMap.get(topic.userId) : undefined"
            :tag-names="topicTags(topic)"
          />
        </div>

        <aside class="new-topic-card-layout__right">
          <section class="new-topic-missed-card">
            <h2>你可能错过</h2>
            <ul>
              <li v-for="topic in recommendedTopics" :key="topic.id">
                <RouterLink :to="`/topic/${topic.id}`">{{
                  topic.title?.trim() || "（无标题）"
                }}</RouterLink>
              </li>
            </ul>
          </section>
        </aside>
      </div>

      <LoadMore
        :has-more="Boolean(query.hasNextPage.value)"
        :loading="query.isFetchingNextPage.value"
        @load-more="loadMore"
      />
      <p v-if="!query.hasNextPage.value" class="new-topics-end">
        无法加载更多了，小水怡情，可不要沉迷哦~
      </p>
    </template>

    <button v-if="y > 234" type="button" class="new-topics-to-top" @click="y = 0">回到顶部</button>
  </section>
</template>
