<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useIntersectionObserver, useMediaQuery, useTitle, useWindowScroll } from "@vueuse/core";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/vue-query";
import { useRoute, useRouter } from "vue-router";
import {
  boardsByIdsQuery,
  currentUserQuery,
  globalTagsQuery,
  newTopicsInfiniteQuery,
  recommendedTopicsQuery,
  usersByIdsQuery,
} from "../../api/queries";
import { queryKeys } from "../../api/queries/keys";
import NewTopicCard from "./components/NewTopicCard.vue";
import NewTopicClassicItem from "./components/NewTopicClassicItem.vue";
import FullPageStatus from "../../components/FullPageStatus.vue";
import LoadMore from "../../components/LoadMore.vue";
import PageState from "../../components/PageState.vue";
import { ANONYMOUS_TOPIC_AVATAR_URL, resolveAvatarUrl } from "../../components/user/avatar";
import { normalizeApiError } from "../../lib/api-error";
import { resolveNewTopicViewMode } from "./new-topics";
import { dedupeTopicsById, uniqueTopicBoardIds, uniqueTopicUserIds } from "./topics";
import { useBatchedLookup } from "./use-batched-lookup";
import { saveLoginRedirect } from "../../lib/login-redirect";
import { useUserStore } from "../../stores/user";

const PAGE_SIZE = 20;
const route = useRoute();
const router = useRouter();
const user = useUserStore();
const queryClient = useQueryClient();
const showProfile = ref(true);
const showCardSidebars = useMediaQuery("(min-width: 1001px)");
const loadMoreTarget = ref<HTMLElement | null>(null);
const { y } = useWindowScroll({ behavior: "smooth" });

useTitle("查看新帖 - CC98 论坛");

const authScope = computed(() => user.user?.id ?? "anonymous");
const canLoad = computed(() => user.isLoggedIn);
const {
  data: me,
  isPending: mePending,
  error: meError,
} = useQuery({
  ...currentUserQuery,
  enabled: () => user.isLoggedIn,
});
const viewMode = computed(() => resolveNewTopicViewMode(me.value?.topicViewMode));
const options = computed(() => newTopicsInfiniteQuery(authScope.value, PAGE_SIZE, canLoad.value));
const query = useInfiniteQuery(options);
const topics = computed(() =>
  dedupeTopicsById(query.data.value?.pages.flatMap((page) => page) ?? []),
);

const customBoardIds = computed(() => me.value?.customBoards ?? []);
const boardIds = computed(() => {
  if (!me.value) return [];
  return [
    ...new Set([
      ...uniqueTopicBoardIds(topics.value),
      ...(viewMode.value === "card" && showCardSidebars.value ? customBoardIds.value : []),
    ]),
  ];
});
const authorIds = computed(() => uniqueTopicUserIds(topics.value));
const {
  records: boardMap,
  error: boardError,
  retry: retryBoards,
} = useBatchedLookup(boardIds, queryKeys.boardsByIdsRoot, (ids) =>
  queryClient.fetchQuery(boardsByIdsQuery(ids)),
);
const {
  records: authorMap,
  error: authorError,
  retry: retryAuthors,
} = useBatchedLookup(authorIds, ["users", "batch"], (ids) =>
  queryClient.fetchQuery(usersByIdsQuery(ids)),
);
const { data: tags } = useQuery(globalTagsQuery);
const tagMap = computed(() => new Map((tags.value ?? []).map((tag) => [tag.id, tag.name])));

const customBoards = computed(() =>
  customBoardIds.value.flatMap((id) => {
    const board = boardMap.value.get(id);
    return board ? [board] : [];
  }),
);
const recommendationsOptions = computed(() =>
  recommendedTopicsQuery(
    authScope.value,
    0,
    6,
    canLoad.value && viewMode.value === "card" && showCardSidebars.value,
  ),
);
const { data: recommendations } = useQuery(recommendationsOptions);
const recommendedTopics = computed(() =>
  (recommendations.value ?? []).flatMap((item) => (item.topic ? [item.topic] : [])),
);
const lookupError = computed(() => boardError.value || authorError.value);

const pageError = computed(() => {
  if (!user.isLoggedIn) return normalizeApiError({ status: 401 });
  if (query.error.value) return normalizeApiError(query.error.value);
  return null;
});
const stateKind = computed(() => {
  if (pageError.value?.kind === "unauthorized") return "unauthorized" as const;
  if (query.isPending.value || (mePending.value && !meError.value)) return "loading" as const;
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

function refresh() {
  void queryClient.resetQueries({ queryKey: options.value.queryKey, exact: true });
  retryMetadata();
}

function retryMetadata() {
  void retryBoards();
  void retryAuthors();
}

onMounted(() => {
  const updatedAt = queryClient.getQueryState(options.value.queryKey)?.dataUpdatedAt;
  if (updatedAt && Date.now() - updatedAt > 60 * 1000) refresh();
});

function goLogin() {
  saveLoginRedirect(route.fullPath);
  void router.push({ name: "logon" });
}

function loadMore() {
  if (!query.hasNextPage.value || query.isFetching.value) return;
  void query.fetchNextPage();
}

useIntersectionObserver(
  loadMoreTarget,
  ([entry]) => {
    if (entry?.isIntersecting && !query.isError.value) loadMore();
  },
  { rootMargin: "240px 0px" },
);

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
      <RouterLink class="new-topics-toolbar__settings" to="/usercenter/settings#reading-style">
        阅读样式设置
      </RouterLink>
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
      <div v-if="lookupError" class="new-topics-lookup-error" role="status">
        部分头像或版面名称暂时无法加载。
        <button type="button" @click="retryMetadata">重试</button>
      </div>
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
        <aside v-if="showCardSidebars" class="new-topic-card-layout__left">
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

        <aside v-if="showCardSidebars" class="new-topic-card-layout__right">
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

      <div ref="loadMoreTarget">
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
  margin-bottom: 1rem;
}

.new-topics-toolbar__settings,
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

.new-topics-toolbar__settings:hover,
.new-topics-refresh:hover {
  background: var(--cc98-color-primary-fill);
  color: var(--cc98-color-on-primary);
}

.new-topics-refresh:disabled {
  cursor: wait;
  opacity: 0.6;
}

.new-topic-classic-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.new-topics-lookup-error {
  margin-bottom: 1rem;
  color: var(--cc98-color-text-muted);
}

.new-topics-lookup-error button {
  border: 0;
  background: transparent;
  color: var(--cc98-color-primary);
  font: inherit;
  cursor: pointer;
}

.new-topic-card-layout {
  display: grid;
  grid-template-columns: 15.625rem 34.625rem 19.875rem;
  gap: 0.375rem;
  align-items: start;
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
  background-color: var(--cc98-color-primary-fill);
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
  background: var(--cc98-color-primary-fill);
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

.new-topics-to-top {
  position: fixed;
  right: 5%;
  bottom: 5%;
  z-index: 2;
  width: 6rem;
  height: 2rem;
  border: 0;
  border-radius: 999px;
  background: var(--cc98-color-primary-fill);
  color: var(--cc98-color-on-primary);
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
