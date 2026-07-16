<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import dayjs from "dayjs";
import { computed } from "vue";
import { RouterLink } from "vue-router";
import { boardsByIdsQuery, currentUserQuery, meRecentTopicsQuery } from "../../api/queries";
import PageState from "../../components/PageState.vue";
import UserProfileOverview from "../../components/user/UserProfileOverview.vue";
import { normalizeApiError } from "../../lib/api-error";
import { useUserStore } from "../../stores/user";

const PAGE_SIZE = 10;
const user = useUserStore();
const authScope = computed(() => user.user?.id ?? "anonymous");

const meQuery = useQuery(currentUserQuery);
const recentQuery = useQuery(
  computed(() => meRecentTopicsQuery(authScope.value, 0, PAGE_SIZE + 1, user.isLoggedIn)),
);

const recentTopics = computed(() => recentQuery.data.value?.slice(0, PAGE_SIZE) ?? []);
const boardIds = computed(() => recentTopics.value.map((topic) => topic.boardId ?? 0));
const boardQuery = useQuery(computed(() => boardsByIdsQuery(boardIds.value)));
const boardMap = computed(
  () => new Map(boardQuery.data.value?.map((board) => [board.id, board]) ?? []),
);

const errorMessage = computed(() => {
  const error = meQuery.error.value ?? recentQuery.error.value ?? boardQuery.error.value;
  return error ? normalizeApiError(error).message : undefined;
});

function formatTime(value: string | undefined): string {
  if (!value) return "—";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD HH:mm") : value;
}

function retry() {
  void meQuery.refetch();
  void recentQuery.refetch();
  void boardQuery.refetch();
}
</script>

<template>
  <PageState v-if="meQuery.isPending.value" kind="loading" />
  <PageState
    v-else-if="meQuery.error.value"
    kind="error"
    :message="errorMessage"
    show-retry
    @retry="retry"
  />

  <div v-else-if="meQuery.data.value" class="user-center-profile">
    <UserProfileOverview :profile="meQuery.data.value" show-wealth />

    <section class="user-center-activities">
      <header>
        <h2>发表的主题</h2>
        <RouterLink to="/usercenter/topics">查看全部</RouterLink>
      </header>

      <PageState v-if="recentQuery.isPending.value" kind="loading" />
      <PageState
        v-else-if="recentQuery.error.value"
        kind="error"
        :message="errorMessage"
        show-retry
        @retry="retry"
      />
      <p v-else-if="recentTopics.length === 0" class="user-center-activities__empty">没有主题</p>
      <ul v-else class="user-center-topic-list">
        <li v-for="topic in recentTopics" :key="topic.id">
          <div class="user-center-topic-list__meta">
            <RouterLink :to="`/list/${topic.boardId}`">
              {{ boardMap.get(topic.boardId ?? 0)?.name ?? `版面 ${topic.boardId}` }}
            </RouterLink>
            <time>{{ formatTime(topic.time) }}</time>
          </div>
          <RouterLink :to="`/topic/${topic.id}`" class="user-center-topic-list__title">
            {{ topic.title?.trim() || "(无标题)" }}
          </RouterLink>
        </li>
      </ul>

      <RouterLink
        v-if="(recentQuery.data.value?.length ?? 0) > PAGE_SIZE"
        to="/usercenter/topics"
        class="user-center-activities__more"
      >
        查看更多主题
      </RouterLink>
    </section>
  </div>
</template>
