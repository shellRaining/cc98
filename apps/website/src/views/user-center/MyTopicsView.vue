<script setup lang="ts">
import { computed } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { useRoute } from "vue-router";
import { meRecentTopicsQuery } from "../../api/queries";
import PageState from "../../components/PageState.vue";
import Pagination from "../../components/Pagination.vue";
import TopicList from "../../components/TopicList.vue";
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
</script>

<template>
  <div class="space-y-4">
    <header>
      <h1 class="text-2xl font-bold">我的主题</h1>
      <p class="mt-1 text-sm text-cc98-text-muted">最近创建的主题。</p>
    </header>
    <PageState v-if="isPending" kind="loading" />
    <PageState
      v-else-if="error"
      kind="error"
      :message="normalizeApiError(error).message"
      show-retry
      @retry="refetch()"
    />
    <PageState v-else-if="topics.length === 0" kind="empty" />
    <template v-else-if="topics.length > 0">
      <div class="cc98-card px-4"><TopicList :topics="topics" /></div>
    </template>
    <Pagination
      v-if="!isPending && !error && (topics.length > 0 || page > 1)"
      :current-page="page"
      :has-next-page="hasNextPage"
      :to-page="(target) => userCenterPagePath('/usercenter/topics', target)"
    />
  </div>
</template>
