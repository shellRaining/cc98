<script setup lang="ts">
import dayjs from "dayjs";
import { computed, ref } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { useRoute } from "vue-router";
import { useSetBrowsingHistoryMutation } from "../../api/mutations";
import { boardsByIdsQuery, currentUserQuery, meBrowsingRecordsQuery } from "../../api/queries";
import PageState from "../../components/PageState.vue";
import Pagination from "../../components/Pagination.vue";
import UiDialog from "../../components/ui/Dialog.vue";
import { normalizeApiError } from "../../lib/api-error";
import { pageCount, pageToFrom } from "../../lib/route-params";
import { useUserStore } from "../../stores/user";
import { parseUserCenterPage, userCenterPagePath } from "./navigation";

const PAGE_SIZE = 10;
const route = useRoute();
const user = useUserStore();
const page = computed(() => parseUserCenterPage(route.query.page));
const authScope = computed(() => user.user?.id ?? "anonymous");
const { data: me, error: meError, refetch: refetchMe } = useQuery(currentUserQuery);
const options = computed(() =>
  meBrowsingRecordsQuery(
    authScope.value,
    pageToFrom(page.value, PAGE_SIZE),
    PAGE_SIZE,
    me.value?.browsingHistoryEnabled !== false,
  ),
);
const { data, error, isPending, refetch } = useQuery(options);
const topics = computed(() => data.value?.data ?? []);
const totalPages = computed(() => pageCount(data.value?.count, PAGE_SIZE));
const boardIds = computed(() => topics.value.flatMap((topic) => topic.boardId ?? []));
const boardOptions = computed(() => boardsByIdsQuery(boardIds.value, boardIds.value.length > 0));
const boardQuery = useQuery(boardOptions);
const boardNames = computed(
  () => new Map(boardQuery.data.value?.map((board) => [board.id, board.name]) ?? []),
);
const notice = ref("");
const setHistory = useSetBrowsingHistoryMutation();

async function toggleHistory() {
  const enabled = me.value?.browsingHistoryEnabled !== true;
  try {
    await setHistory.mutateAsync(enabled);
    notice.value = enabled ? "浏览历史已开启" : "浏览历史已关闭";
  } catch (mutationError) {
    notice.value = normalizeApiError(mutationError).message;
  }
}

function formatTime(value: string | undefined): string {
  if (!value) return "—";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD HH:mm:ss") : value;
}
</script>

<template>
  <div class="user-content-page user-history">
    <UiDialog
      alert
      :title="me?.browsingHistoryEnabled ? '确定要关闭浏览历史吗？' : '确定要开启浏览历史吗？'"
      :description="
        me?.browsingHistoryEnabled
          ? '该设置将在网页版和小程序中同步。关闭期间不记录主题帖浏览历史。'
          : '该设置将在网页版和小程序中同步。开启后，将保存最近 30 天的主题帖浏览历史。'
      "
      confirm-label="确认"
      confirm-variant="primary"
      width-class="w-[min(50rem,calc(100vw-2rem))]"
      :pending="setHistory.isPending.value"
      @confirm="toggleHistory"
    >
      <template #trigger>
        <button
          type="button"
          class="user-history-toggle"
          role="checkbox"
          :aria-checked="me?.browsingHistoryEnabled === true"
          :disabled="setHistory.isPending.value || Boolean(meError)"
        >
          <span aria-hidden="true">{{ me?.browsingHistoryEnabled ? "✓" : "" }}</span>
          开启历史记录功能
        </button>
      </template>
    </UiDialog>

    <p v-if="meError" class="user-history__message">
      {{ normalizeApiError(meError).message }}
      <button type="button" @click="refetchMe()">重试</button>
    </p>
    <p v-if="notice" class="user-history__message" role="status">{{ notice }}</p>

    <hr />

    <PageState v-if="isPending" kind="loading" />
    <PageState
      v-else-if="error"
      kind="error"
      :message="normalizeApiError(error).message"
      show-retry
      @retry="refetch()"
    />
    <p v-else-if="topics.length === 0" class="user-content-empty">没有主题</p>
    <ul v-else class="user-content-list">
      <li v-for="topic in topics" :key="topic.id">
        <div class="user-content-list__meta">
          <RouterLink v-if="topic.boardId" :to="`/list/${topic.boardId}`">
            {{ boardNames.get(topic.boardId) ?? topic.boardName ?? `版面 ${topic.boardId}` }}
          </RouterLink>
          <span v-else>未知版面</span>
          <time :datetime="topic.time">{{ formatTime(topic.time) }}</time>
        </div>
        <RouterLink :to="`/topic/${topic.id}`" class="user-content-list__title">
          {{ topic.title?.trim() || "(无标题)" }}
        </RouterLink>
      </li>
    </ul>
    <Pagination
      v-if="!isPending && !error && (topics.length > 0 || page > 1)"
      :current-page="page"
      :total-pages="totalPages"
      :to-page="(target) => userCenterPagePath('/usercenter/history', target)"
      variant="user-center"
    />
  </div>
</template>

<style scoped>
.user-content-page {
  min-height: 36rem;
}

.user-content-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.user-content-list li {
  padding-bottom: 1.875rem;
}

.user-content-list li + li {
  padding-top: 1.875rem;
  border-top: 1px dashed var(--cc98-color-border);
}

.user-content-list__meta {
  display: flex;
  min-height: 1.4rem;
  align-items: baseline;
  gap: 2rem;
  margin-bottom: 1.875rem;
}

.user-content-list__meta a,
.user-content-list__meta a:visited {
  min-width: 6rem;
  color: var(--cc98-color-primary);
}

.user-content-list__meta span,
.user-content-list__meta time {
  color: var(--cc98-color-text);
}

.user-content-list__title,
.user-content-list__title:visited {
  display: -webkit-box;
  max-height: 5rem;
  overflow: hidden;
  padding-right: 3rem;
  color: var(--cc98-color-text);
  font-size: 0.88rem;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.user-content-list__title:hover {
  color: var(--cc98-color-primary);
}

.user-content-empty {
  margin: 2rem 0;
  color: var(--cc98-color-text-muted);
  text-align: center;
}

.user-history-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--cc98-color-text);
  font: inherit;
  cursor: pointer;
}

.user-history-toggle > span {
  display: inline-flex;
  width: 1rem;
  height: 1rem;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--cc98-color-border);
  border-radius: 0.15rem;
  color: #fff;
  font-size: 0.75rem;
  line-height: 1;
}

.user-history-toggle[aria-checked="true"] > span {
  border-color: var(--cc98-color-primary);
  background: var(--cc98-color-primary-fill);
}

.user-history-toggle:disabled {
  cursor: wait;
  opacity: 0.6;
}

.user-history > hr {
  height: 0;
  margin: 1.5rem 0 1.875rem;
  border: 0;
  border-top: 1px dashed var(--cc98-color-border);
}

.user-history__message {
  margin: 0.75rem 0 0;
  color: var(--cc98-color-text-muted);
  font-size: 0.75rem;
}

.user-history__message button {
  padding: 0;
  border: 0;
  margin-left: 0.5rem;
  background: transparent;
  color: var(--cc98-color-primary);
  font: inherit;
  cursor: pointer;
}
</style>
