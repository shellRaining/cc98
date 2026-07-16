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
import { pageToFrom } from "../../lib/route-params";
import { pageCount, parseUserCenterPage, userCenterPagePath } from "../../lib/user-center";
import { useUserStore } from "../../stores/user";

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
