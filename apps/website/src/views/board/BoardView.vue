<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useTitle } from "@vueuse/core";
import { useQuery } from "@tanstack/vue-query";
import { useRoute, useRouter } from "vue-router";
import {
  boardEventsQuery,
  boardFilteredTopicsQuery,
  boardQuery,
  boardTagsQuery,
  boardTopicsQuery,
  boardTopTopicsQuery,
  homepageAdvertisementsQuery,
} from "../../api/queries";
import { useFollowBoardMutation, useUnfollowBoardMutation } from "../../api/mutations";
import BoardEventList from "./components/BoardEventList.vue";
import BoardBatchModerationDialog from "./components/BoardBatchModerationDialog.vue";
import BoardHeader from "./components/BoardHeader.vue";
import FullPageStatus from "../../components/FullPageStatus.vue";
import HomeAdvertisement from "../../components/home/HomeAdvertisement.vue";
import PageState from "../../components/PageState.vue";
import Pagination from "../../components/Pagination.vue";
import TopicList from "./components/TopicList.vue";
import { normalizeApiError } from "../../lib/api-error";
import {
  boardViewPath,
  resolveBoardTag,
  resolveBoardViewMode,
  resolveBoardViewPage,
} from "./navigation.ts";
import { visibleHomepageColumns } from "../../components/home/model.ts";
import { saveLoginRedirect } from "../../lib/login-redirect";
import { isBoardManager } from "../../components/moderation/access";
import { boardTotalPages, clampPage, pageToFrom, parsePositiveInt } from "../../lib/route-params";
import { useUserStore } from "../../stores/user";

const props = defineProps<{
  boardId: string;
  type?: string;
  page?: string;
}>();

const PAGE_SIZE = 20;
const route = useRoute();
const router = useRouter();
const user = useUserStore();
const followBoard = useFollowBoardMutation();
const unfollowBoard = useUnfollowBoardMutation();

const numericBoardId = computed(() => parsePositiveInt(props.boardId));
const invalidId = computed(() => numericBoardId.value == null);
const mode = computed(() => resolveBoardViewMode(props.type));
const requestedPage = computed(() => resolveBoardViewPage(props.type, props.page));
const tag1 = computed(() => resolveBoardTag(route.query.tag1));
const tag2 = computed(() => resolveBoardTag(route.query.tag2));
const authScope = computed(() => user.user?.id ?? "anonymous");
const selectedTopicIds = ref(new Set<number>());
const batchDialogOpen = ref(false);

const boardOptions = computed(() =>
  boardQuery(numericBoardId.value ?? 0, authScope.value, !invalidId.value),
);
const {
  data: board,
  error: boardError,
  isPending: boardPending,
  refetch: refetchBoard,
} = useQuery(boardOptions);

useTitle(
  computed(() => (board.value?.name ? `${board.value.name} - CC98 论坛` : "版面 - CC98 论坛")),
);

const needLoginForEntry = computed(() => board.value?.canEntry === false && !user.isLoggedIn);
const forbiddenEntry = computed(() => board.value?.canEntry === false && user.isLoggedIn);
const canLoadContent = computed(
  () =>
    !invalidId.value && user.isLoggedIn && board.value != null && board.value.canEntry !== false,
);

const tagsOptions = computed(() =>
  boardTagsQuery(numericBoardId.value ?? 0, !invalidId.value && board.value != null),
);
const { data: tagGroups } = useQuery(tagsOptions);
const tagNames = computed(() => {
  const result = new Map<number, string>();
  for (const group of tagGroups.value ?? []) {
    for (const tag of group.tags ?? []) {
      if (tag.id != null && tag.name) result.set(tag.id, tag.name);
    }
  }
  return result;
});

const preliminaryPage = computed(() => Math.max(1, requestedPage.value));
const from = computed(() => pageToFrom(preliminaryPage.value, PAGE_SIZE));

const topicsOptions = computed(() =>
  boardTopicsQuery(
    numericBoardId.value ?? 0,
    authScope.value,
    from.value,
    PAGE_SIZE,
    canLoadContent.value && mode.value === "all",
  ),
);
const topOptions = computed(() =>
  boardTopTopicsQuery(
    numericBoardId.value ?? 0,
    authScope.value,
    canLoadContent.value && mode.value === "all" && preliminaryPage.value === 1,
  ),
);
const filteredOptions = computed(() =>
  boardFilteredTopicsQuery(
    numericBoardId.value ?? 0,
    mode.value === "best" || mode.value === "save" || mode.value === "tag" ? mode.value : "best",
    authScope.value,
    from.value,
    PAGE_SIZE,
    tag1.value,
    tag2.value,
    canLoadContent.value && ["best", "save", "tag"].includes(mode.value),
  ),
);
const eventsOptions = computed(() =>
  boardEventsQuery(
    numericBoardId.value ?? 0,
    authScope.value,
    from.value,
    PAGE_SIZE,
    canLoadContent.value && mode.value === "record",
  ),
);

const normalQuery = useQuery(topicsOptions);
const topQuery = useQuery(topOptions);
const filteredQuery = useQuery(filteredOptions);
const eventsQuery = useQuery(eventsOptions);
const advertisementsQuery = useQuery(homepageAdvertisementsQuery);
const advertisements = computed(() => visibleHomepageColumns(advertisementsQuery.data.value ?? []));

const pinnedIds = computed(() => {
  const ids = new Set<number>();
  for (const topic of topQuery.data.value ?? []) {
    if (topic.id != null) ids.add(topic.id);
  }
  return ids;
});

const displayedTopics = computed(() => {
  if (mode.value !== "all") return filteredQuery.data.value?.topics ?? [];
  const normals = normalQuery.data.value ?? [];
  if (preliminaryPage.value !== 1) return normals;
  const result = [];
  const seen = new Set<number>();
  for (const topic of [...(topQuery.data.value ?? []), ...normals]) {
    if (topic.id == null || !seen.has(topic.id)) result.push(topic);
    if (topic.id != null) seen.add(topic.id);
  }
  return result;
});

const totalPages = computed(() => {
  if (mode.value === "all") return boardTotalPages(board.value?.topicCount, PAGE_SIZE);
  if (mode.value === "record") return boardTotalPages(eventsQuery.data.value?.count, PAGE_SIZE);
  return boardTotalPages(filteredQuery.data.value?.count, PAGE_SIZE);
});
const currentPage = computed(() => clampPage(preliminaryPage.value, totalPages.value));

watch(
  [requestedPage, totalPages, numericBoardId, mode, tag1, tag2],
  ([page, total, id, currentMode, currentTag1, currentTag2]) => {
    if (id == null || total == null) return;
    const clamped = clampPage(page, total);
    if (page !== clamped) {
      void router.replace(
        boardViewPath(id, currentMode, clamped, { tag1: currentTag1, tag2: currentTag2 }),
      );
    }
  },
  { flush: "post" },
);

const contentPending = computed(() => {
  if (!canLoadContent.value) return false;
  if (mode.value === "all") {
    return normalQuery.isPending.value || (currentPage.value === 1 && topQuery.isPending.value);
  }
  if (mode.value === "record") return eventsQuery.isPending.value;
  return filteredQuery.isPending.value;
});

const contentError = computed(() => {
  if (mode.value === "all") return normalQuery.error.value ?? topQuery.error.value;
  if (mode.value === "record") return eventsQuery.error.value;
  return filteredQuery.error.value;
});

const pageError = computed(() => {
  if (invalidId.value) return normalizeApiError({ status: 404 });
  if (boardError.value) return normalizeApiError(boardError.value);
  if (needLoginForEntry.value) return normalizeApiError({ status: 401 });
  if (forbiddenEntry.value) return normalizeApiError({ status: 403 });
  if (!user.isLoggedIn && !boardPending.value && board.value)
    return normalizeApiError({ status: 401 });
  if (contentError.value) return normalizeApiError(contentError.value);
  return null;
});

const stateKind = computed(() => {
  if (invalidId.value) return "not-found" as const;
  if (boardPending.value) return "loading" as const;
  if (pageError.value?.kind === "unauthorized") return "unauthorized" as const;
  if (pageError.value?.kind === "forbidden") return "forbidden" as const;
  if (pageError.value?.kind === "not-found") return "not-found" as const;
  if (pageError.value) return "error" as const;
  if (contentPending.value) return "loading" as const;
  if (mode.value === "record" && (eventsQuery.data.value?.boardEvents.length ?? 0) === 0)
    return "empty" as const;
  if (mode.value !== "record" && displayedTopics.value.length === 0) return "empty" as const;
  return null;
});

const blockingState = computed(() => {
  if (!board.value) return stateKind.value;
  if (stateKind.value === "unauthorized" || stateKind.value === "forbidden") return stateKind.value;
  return null;
});

const relationPending = computed(
  () => followBoard.isPending.value || unfollowBoard.isPending.value,
);
const canBatchManage = computed(
  () => mode.value === "all" && isBoardManager(user.user, board.value),
);

watch([displayedTopics, mode], () => {
  selectedTopicIds.value = new Set();
});

function toPage(page: number) {
  return boardViewPath(props.boardId, mode.value, page, { tag1: tag1.value, tag2: tag2.value });
}

function modePath(nextMode: "all" | "best" | "save" | "record") {
  return boardViewPath(props.boardId, nextMode);
}

function tagPath(layer: number, id?: number) {
  return boardViewPath(props.boardId, "tag", 1, {
    tag1: layer === 1 ? id : tag1.value,
    tag2: layer === 2 ? id : tag2.value,
  });
}

function goLogin() {
  saveLoginRedirect(route.fullPath);
  void router.push({ name: "logon" });
}

function retry() {
  void refetchBoard();
  if (mode.value === "all") {
    void normalQuery.refetch();
    if (currentPage.value === 1) void topQuery.refetch();
  } else if (mode.value === "record") void eventsQuery.refetch();
  else void filteredQuery.refetch();
}

function toggleBoardFollow() {
  const id = numericBoardId.value;
  if (!id || relationPending.value) return;
  if (!user.isLoggedIn) return goLogin();
  if (board.value?.isUserCustomBoard) unfollowBoard.mutate(id);
  else followBoard.mutate(id);
}

function toggleTopic(topic: { id?: number }, checked: boolean) {
  if (topic.id == null) return;
  const next = new Set(selectedTopicIds.value);
  if (checked) next.add(topic.id);
  else next.delete(topic.id);
  selectedTopicIds.value = next;
}

function completeBatchModeration() {
  selectedTopicIds.value = new Set();
  void normalQuery.refetch();
  void topQuery.refetch();
  void refetchBoard();
}
</script>

<template>
  <FullPageStatus
    v-if="blockingState === 'unauthorized'"
    kind="unauthorized"
    document-title="您没有权限进入这个版面"
    message="您没有权限进入这个版面或未登录"
    show-home
    @login="goLogin"
  />
  <section v-else class="board-page">
    <nav v-if="!blockingState" class="board-breadcrumb" aria-label="面包屑">
      <RouterLink to="/">首页</RouterLink><span>›</span>
      <RouterLink to="/boardlist">版面列表</RouterLink><span>›</span>
      <RouterLink v-if="board?.name" :to="modePath('all')">{{ board.name }}</RouterLink>
    </nav>

    <PageState
      v-if="blockingState"
      :kind="blockingState"
      :message="pageError?.message"
      :show-retry="stateKind === 'error'"
      @login="goLogin"
      @retry="retry"
    />

    <template v-else-if="board">
      <BoardHeader
        :board="board"
        :follow-pending="relationPending"
        @toggle-follow="toggleBoardFollow"
      />

      <p v-if="followBoard.error.value || unfollowBoard.error.value" class="board-page__error">
        {{ normalizeApiError(followBoard.error.value ?? unfollowBoard.error.value).message }}
      </p>

      <div class="board-action-row">
        <div class="board-action-row__buttons">
          <RouterLink :to="{ name: 'create-topic', params: { boardId } }">发主题</RouterLink>
          <RouterLink
            v-if="board.canVote"
            :to="{ name: 'create-topic', params: { boardId }, query: { vote: '1' } }"
          >
            发投票
          </RouterLink>
        </div>
        <HomeAdvertisement v-if="advertisements.length" :items="advertisements" />
      </div>

      <div class="board-filter-row">
        <div class="board-tag-layers">
          <div v-for="group in tagGroups ?? []" :key="group.layer" class="board-tag-layer">
            <RouterLink
              :to="tagPath(group.layer ?? 1)"
              :class="{ 'is-active': !(group.layer === 1 ? tag1 : tag2) }"
            >
              全部
            </RouterLink>
            <RouterLink
              v-for="tag in group.tags ?? []"
              :key="tag.id ?? tag.name"
              :to="tagPath(group.layer ?? 1, tag.id)"
              :class="{ 'is-active': (group.layer === 1 ? tag1 : tag2) === tag.id }"
            >
              {{ tag.name }}
            </RouterLink>
          </div>
        </div>
        <Pagination
          :current-page="currentPage"
          :total-pages="totalPages"
          :has-next-page="displayedTopics.length >= PAGE_SIZE"
          :to-page="toPage"
        />
      </div>

      <div class="board-list-panel">
        <div v-if="canBatchManage" class="board-batch-toolbar">
          <span>已选择 {{ selectedTopicIds.size }} 个主题</span>
          <button
            type="button"
            :disabled="selectedTopicIds.size === 0"
            @click="batchDialogOpen = true"
          >
            批量管理
          </button>
        </div>
        <div class="board-list-panel__head">
          <nav aria-label="主题筛选">
            <RouterLink
              :to="modePath('all')"
              :class="{ 'is-active': mode === 'all' || mode === 'tag' }"
              >全部</RouterLink
            >
            <RouterLink :to="modePath('best')" :class="{ 'is-active': mode === 'best' }"
              >精华</RouterLink
            >
            <RouterLink :to="modePath('save')" :class="{ 'is-active': mode === 'save' }"
              >保存</RouterLink
            >
          </nav>
          <div v-if="mode !== 'record'" class="board-list-panel__columns">
            <span>作者</span><span>最后回复</span>
          </div>
        </div>

        <PageState
          v-if="stateKind"
          :kind="stateKind"
          :message="pageError?.message"
          :show-retry="stateKind === 'error'"
          @login="goLogin"
          @retry="retry"
        />
        <BoardEventList
          v-else-if="mode === 'record'"
          :events="eventsQuery.data.value?.boardEvents ?? []"
        />
        <TopicList
          v-else
          :topics="displayedTopics"
          :pinned-ids="pinnedIds"
          :show-board="false"
          variant="board"
          :tag-names="tagNames"
          :selectable="canBatchManage"
          :selected-ids="selectedTopicIds"
          @toggle="toggleTopic"
        />
      </div>

      <BoardBatchModerationDialog
        v-model:open="batchDialogOpen"
        :board-id="numericBoardId ?? 0"
        :topic-ids="[...selectedTopicIds]"
        @completed="completeBatchModeration"
      />

      <div class="board-page__bottom">
        <Pagination
          :current-page="currentPage"
          :total-pages="totalPages"
          :has-next-page="displayedTopics.length >= PAGE_SIZE"
          :to-page="toPage"
        />
        <div>
          <RouterLink :to="{ path: '/search', query: { boardId } }">版内搜索</RouterLink>
          <RouterLink :to="modePath('record')">查看版面事件</RouterLink>
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.board-page {
  width: 100%;
  font-family: "Microsoft YaHei", system-ui, sans-serif;
}

.board-breadcrumb {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 1rem;
  color: var(--cc98-color-text-muted);
  font-size: 1rem;
}

.board-breadcrumb a,
.board-breadcrumb a:visited {
  color: var(--cc98-color-text-muted);
}

.board-breadcrumb a:hover {
  color: var(--cc98-color-primary);
}

.board-page__error {
  margin: 0.5rem 0 0;
  color: var(--cc98-color-accent);
  font-size: 0.75rem;
}

.board-action-row {
  display: flex;
  min-height: 6.25rem;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1rem;
}

.board-action-row__buttons {
  display: flex;
  gap: 2rem;
}

.board-action-row__buttons a,
.board-action-row__buttons a:visited {
  display: grid;
  width: 7rem;
  height: 4rem;
  border-radius: 1rem;
  background: var(--cc98-color-primary);
  color: #fff;
  font-size: 1.25rem;
  place-items: center;
}

.board-action-row__buttons a:hover {
  background: var(--cc98-color-primary-hover);
}

.board-action-row :deep(.home-advertisement) {
  width: 18.75rem;
  flex: none;
}

.board-filter-row {
  display: flex;
  min-height: 4.75rem;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin: 0.9375rem 0 1rem;
}

.board-tag-layers {
  display: flex;
  max-width: 35rem;
  flex: 1;
  flex-direction: column;
  gap: 0.5rem;
}

.board-tag-layer {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 0.625rem;
  padding-top: 0.5rem;
  border-top: 1px dashed var(--cc98-color-border);
}

.board-tag-layer a,
.board-tag-layer a:visited {
  display: grid;
  min-width: 5rem;
  height: 2rem;
  padding-inline: 0.65rem;
  border: 1px solid var(--cc98-color-secondary);
  border-radius: 0.3125rem;
  background: var(--cc98-color-surface);
  color: var(--cc98-color-text);
  font-size: 0.75rem;
  place-items: center;
}

.board-tag-layer a:hover,
.board-tag-layer a.is-active {
  background: var(--cc98-color-secondary);
  color: #fff;
}

.board-list-panel {
  overflow: hidden;
  border: 1px solid var(--cc98-color-primary);
  background: var(--cc98-color-surface);
}

.board-list-panel__head {
  display: grid;
  min-height: 3rem;
  align-items: center;
  background: var(--cc98-color-primary);
  color: #fff;
  grid-template-columns: minmax(0, 1fr) 28rem;
}

.board-list-panel__head nav {
  display: flex;
  gap: 1.25rem;
  padding-inline: 1.25rem;
}

.board-list-panel__head a,
.board-list-panel__head a:visited {
  padding-block: 0.625rem;
  color: #fff;
}

.board-list-panel__head a.is-active {
  text-decoration: underline;
  text-underline-offset: 0.25rem;
}

.board-list-panel__columns {
  display: grid;
  font-size: 0.75rem;
  grid-template-columns: 15rem 12rem;
}

.board-list-panel > :deep(.rounded) {
  border: 0;
  border-radius: 0;
}

.board-batch-toolbar {
  display: flex;
  min-height: 2.75rem;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
  padding: 0.35rem 1rem;
  border-bottom: 1px solid var(--cc98-color-border);
  color: var(--cc98-color-text-muted);
  font-size: 0.75rem;
}

.board-batch-toolbar button {
  padding: 0.35rem 0.8rem;
  border: 1px solid var(--cc98-color-primary);
  border-radius: 0.2rem;
  background: var(--cc98-color-primary);
  color: #fff;
  cursor: pointer;
}

.board-batch-toolbar button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.board-page__bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 0.5rem;
}

.board-page__bottom > div {
  display: flex;
  gap: 0.5rem;
}

.board-page__bottom > div a,
.board-page__bottom > div a:visited {
  padding: 0.4rem 0.75rem;
  background: var(--cc98-color-primary);
  color: #fff;
  font-size: 0.875rem;
}
</style>
