<script setup lang="ts">
import { computed, ref } from "vue";
import { useTitle, useWindowScroll } from "@vueuse/core";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/vue-query";
import { useRoute, useRouter } from "vue-router";
import { useSetTopicViewModeMutation } from "../../api/mutations";
import {
  boardsByIdsQuery,
  currentUserQuery,
  globalTagsQuery,
  newTopicsInfiniteQuery,
  recommendedTopicsQuery,
  usersByIdsQuery,
} from "../../api/queries";
import NewTopicCard from "./components/NewTopicCard.vue";
import NewTopicClassicItem from "./components/NewTopicClassicItem.vue";
import FullPageStatus from "../../components/FullPageStatus.vue";
import LoadMore from "../../components/LoadMore.vue";
import PageState from "../../components/PageState.vue";
import { ANONYMOUS_TOPIC_AVATAR_URL, resolveAvatarUrl } from "../../components/user/avatar";
import { normalizeApiError } from "../../lib/api-error";
import {
  newTopicsPath,
  newTopicViewPreference,
  resolveNewTopicViewMode,
  type NewTopicViewMode,
} from "./new-topics";
import { dedupeTopicsById, uniqueTopicBoardIds, uniqueTopicUserIds } from "./topics";
import { saveLoginRedirect } from "../../lib/login-redirect";
import { useUserStore } from "../../stores/user";

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
                :src="showProfile ? resolveAvatarUrl(me?.portraitUrl) : ANONYMOUS_TOPIC_AVATAR_URL"
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

<style scoped>
.new-topics-page {
  position: relative;
  width: 100%;
  min-height: 48.75rem;
  font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
}

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

.new-topics-toolbar {
  position: relative;
  display: flex;
  min-height: 2.25rem;
  align-items: flex-start;
  justify-content: space-between;
}

.new-topics-toolbar__modes {
  display: flex;
  gap: 1rem;
}

.new-topics-toolbar__modes button,
.new-topics-refresh {
  min-width: 6rem;
  padding: 0.375rem 0.75rem;
  border: 1px solid var(--cc98-color-primary);
  border-radius: 0.25rem;
  background: transparent;
  color: var(--cc98-color-primary);
  font: inherit;
  font-size: 1rem;
  cursor: pointer;
}

.new-topics-toolbar__modes button:hover,
.new-topics-toolbar__modes button.is-active,
.new-topics-refresh:hover {
  background: var(--cc98-color-primary);
  color: #fff;
}

.new-topics-refresh:disabled {
  cursor: wait;
  opacity: 0.6;
}

.new-topic-classic-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.45rem;
}

.new-topic-card-layout {
  display: grid;
  grid-template-columns: 15.625rem 34.625rem 19.875rem;
  gap: 0.375rem;
  align-items: start;
  margin-top: 1.2rem;
}

.new-topic-card-layout__left,
.new-topic-card-layout__middle,
.new-topic-card-layout__right {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0.375rem;
}

.new-topic-card-layout__left,
.new-topic-card-layout__right {
  position: sticky;
  top: 0.625rem;
}

.new-topic-profile-card,
.new-topic-board-card,
.new-topic-missed-card {
  overflow: hidden;
  border: 1.5px solid var(--cc98-color-primary);
  border-radius: 0.25rem;
  background: var(--cc98-color-surface);
}

.new-topic-profile-card__background {
  height: 4.0625rem;
  background-color: var(--cc98-color-primary);
  background-image: var(--cc98-banner-card-image);
  background-position: center;
  background-size: cover;
}

.new-topic-profile-card__identity {
  position: relative;
  display: flex;
  min-height: 3.5rem;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0 0.8rem;
}

.new-topic-profile-card__identity img {
  width: 5rem;
  height: 5rem;
  margin-top: -2.5rem;
  border-radius: 50%;
  background: var(--cc98-color-primary);
  object-fit: cover;
}

.new-topic-profile-card__identity a {
  max-width: 6.5rem;
  margin-top: 0.25rem;
  overflow: hidden;
  color: var(--cc98-color-text);
  font-size: 1.25rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.new-topic-profile-card__identity button {
  margin: 0.4rem 0 0 auto;
  border: 0;
  background: transparent;
  color: var(--cc98-color-text-muted);
  cursor: pointer;
}

.new-topic-profile-card__stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  margin: 0.4rem 0.75rem 0.75rem;
}

.new-topic-profile-card__stats div {
  text-align: center;
}

.new-topic-profile-card__stats dt,
.new-topic-profile-card__stats dd {
  margin: 0;
}

.new-topic-profile-card__stats dd {
  color: var(--cc98-color-text);
  font-size: 1.05rem;
}

.new-topic-profile-card__stats dt {
  color: var(--cc98-color-text-muted);
  font-size: 0.75rem;
}

.new-topic-board-card,
.new-topic-missed-card {
  padding: 0.9rem;
}

.new-topic-board-card h2,
.new-topic-missed-card h2 {
  margin: 0 0 0.75rem;
  font-size: 1.125rem;
  font-weight: 400;
}

.new-topic-board-card ul,
.new-topic-missed-card ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.new-topic-board-card li,
.new-topic-missed-card li {
  overflow: hidden;
  padding: 0.35rem 0;
  font-size: 0.8rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.new-topic-board-card p {
  color: var(--cc98-color-text-muted);
  font-size: 0.8rem;
}

.new-topics-end {
  text-align: center;
  color: var(--cc98-color-text-muted);
}

.new-topics-to-top {
  position: fixed;
  right: 5%;
  bottom: 5%;
  z-index: 2;
  width: 6rem;
  height: 2rem;
  border: 0;
  border-radius: 999px;
  background: var(--cc98-color-primary);
  color: #fff;
  font: inherit;
  cursor: pointer;
  opacity: 0.55;
}

.new-topics-to-top:hover {
  opacity: 0.85;
}

@media (max-width: 1180px) {
  .new-topic-card-layout {
    grid-template-columns: 14rem minmax(0, 1fr) 17rem;
  }
}

@media (max-width: 1000px) {
  .new-topic-card-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .new-topic-card-layout__left,
  .new-topic-card-layout__right {
    position: static;
  }
}
</style>
