<script setup lang="ts">
import dayjs from "dayjs";
import { computed, ref } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { useRoute } from "vue-router";
import { useSetBrowsingHistoryMutation } from "../../api/mutations";
import { currentUserQuery, meBrowsingRecordsQuery } from "../../api/queries";
import PageState from "../../components/PageState.vue";
import UiButton from "../../components/ui/Button.vue";
import Pagination from "../../components/Pagination.vue";
import TopicList from "../../components/TopicList.vue";
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
  meBrowsingRecordsQuery(authScope.value, pageToFrom(page.value, PAGE_SIZE), PAGE_SIZE),
);
const { data, error, isPending, refetch } = useQuery(options);
const topics = computed(() => data.value?.data ?? []);
const totalPages = computed(() => pageCount(data.value?.count, PAGE_SIZE));
const notice = ref("");
const setHistory = useSetBrowsingHistoryMutation();

async function toggleHistory(event: Event) {
  const enabled = (event.target as HTMLInputElement).checked;
  try {
    await setHistory.mutateAsync(enabled);
    notice.value = enabled ? "浏览历史已开启" : "浏览历史已关闭";
  } catch (mutationError) {
    notice.value = normalizeApiError(mutationError).message;
  }
}

function formatBrowsingTime(value: string | undefined): string {
  if (!value) return "时间未知";
  const parsed = dayjs(value);
  return parsed.isValid() ? `最近浏览于 ${parsed.format("YYYY-MM-DD HH:mm")}` : value;
}
</script>

<template>
  <div class="space-y-4">
    <header>
      <h1 class="text-2xl font-bold">浏览历史</h1>
      <p class="mt-1 text-sm text-cc98-text-muted">查看最近 30 天访问过的主题。</p>
    </header>

    <div class="cc98-card p-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <strong>记录浏览历史</strong>
        <p class="text-sm text-cc98-text-muted">该设置会与其他 CC98 客户端同步。</p>
      </div>
      <label class="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          :checked="me?.browsingHistoryEnabled === true"
          :disabled="setHistory.isPending.value || Boolean(meError)"
          @change="toggleHistory"
        />
        {{ me?.browsingHistoryEnabled ? "已开启" : "已关闭" }}
      </label>
      <p v-if="meError" class="w-full text-sm text-cc98-error">
        {{ normalizeApiError(meError).message }}
        <UiButton variant="text" class="ml-2" @click="refetchMe()">重试</UiButton>
      </p>
      <p v-if="notice" class="w-full text-sm text-cc98-text-muted" role="status">{{ notice }}</p>
    </div>

    <PageState v-if="isPending" kind="loading" />
    <PageState
      v-else-if="error"
      kind="error"
      :message="normalizeApiError(error).message"
      show-retry
      @retry="refetch()"
    />
    <PageState v-else-if="topics.length === 0" kind="empty" message="还没有浏览记录。" />
    <template v-else-if="topics.length > 0">
      <div class="cc98-card px-4">
        <TopicList :topics="topics">
          <template #item="{ topic }">
            <p class="mt-1 text-xs text-cc98-text-muted">
              {{ formatBrowsingTime(topic.lastBrowsingTime) }}
            </p>
          </template>
        </TopicList>
      </div>
    </template>
    <Pagination
      v-if="!isPending && !error && (topics.length > 0 || page > 1)"
      :current-page="page"
      :total-pages="totalPages"
      :to-page="(target) => userCenterPagePath('/usercenter/history', target)"
    />
  </div>
</template>
