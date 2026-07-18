<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import dayjs from "dayjs";
import { computed } from "vue";
import { useRoute } from "vue-router";
import { boardsByIdsQuery, meRecentTopicsQuery } from "../../api/queries";
import PageState from "../../components/PageState.vue";
import Pagination from "../../components/Pagination.vue";
import { normalizeApiError } from "../../lib/api-error";
import { pageToFrom } from "../../lib/route-params";
import { parseUserCenterPage, userCenterPagePath } from "../../lib/user-center";
import { useUserStore } from "../../stores/user";

const PAGE_SIZE = 10;
const route = useRoute();
const user = useUserStore();
const page = computed(() => parseUserCenterPage(route.query.page));
const authScope = computed(() => user.user?.id ?? "anonymous");
const options = computed(() =>
  meRecentTopicsQuery(authScope.value, pageToFrom(page.value, PAGE_SIZE), PAGE_SIZE + 1),
);
const { data, error, isPending, refetch } = useQuery(options);
const topics = computed(() => data.value?.slice(0, PAGE_SIZE) ?? []);
const hasNextPage = computed(() => (data.value?.length ?? 0) > PAGE_SIZE);
const boardIds = computed(() => topics.value.flatMap((topic) => topic.boardId ?? []));
const boardOptions = computed(() => boardsByIdsQuery(boardIds.value, boardIds.value.length > 0));
const boardQuery = useQuery(boardOptions);
const boardNames = computed(
  () => new Map(boardQuery.data.value?.map((board) => [board.id, board.name]) ?? []),
);

function formatTime(value: string | undefined): string {
  if (!value) return "—";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD HH:mm:ss") : value;
}
</script>

<template>
  <div class="user-content-page">
    <PageState v-if="isPending" kind="loading" />
    <PageState
      v-else-if="error"
      kind="error"
      :message="normalizeApiError(error).message"
      show-retry
      @retry="refetch()"
    />
    <PageState v-else-if="topics.length === 0" kind="empty" />
    <ul v-else-if="topics.length > 0" class="user-content-list">
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
      :has-next-page="hasNextPage"
      :to-page="(target) => userCenterPagePath('/usercenter/topics', target)"
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
</style>
