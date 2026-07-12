<script setup lang="ts">
import { computed } from "vue";
import { useQuery } from "@tanstack/vue-query";
import dayjs from "dayjs";
import { useRoute } from "vue-router";
import { useReadAllNotificationsMutation } from "../../api/mutations";
import { notificationsQuery, unreadCountsQuery, type NotificationKind } from "../../api/queries";
import PageState from "../../components/PageState.vue";
import Pagination from "../../components/Pagination.vue";
import ContentRenderer from "../../components/rich-content/ContentRenderer.vue";
import { normalizeApiError } from "../../lib/api-error";
import {
  notificationCount,
  notificationDescription,
  notificationTopicPath,
} from "../../lib/messages";
import { pageToFrom, parsePageNumber } from "../../lib/route-params";
import { useUserStore } from "../../stores/user";

const PAGE_SIZE = 20;
const route = useRoute();
const user = useUserStore();
const kind = computed(() => route.meta.notificationKind as NotificationKind);
const page = computed(() => parsePageNumber(String(route.query.page ?? "1")));
const authScope = computed(() => user.user?.id ?? "anonymous");

const { data, error, isPending, refetch } = useQuery(
  computed(() =>
    notificationsQuery(
      kind.value,
      authScope.value,
      pageToFrom(page.value, PAGE_SIZE),
      PAGE_SIZE,
      user.isLoggedIn,
    ),
  ),
);
const { data: counts } = useQuery(
  computed(() => unreadCountsQuery(authScope.value, user.isLoggedIn)),
);
const readAll = useReadAllNotificationsMutation();

const title = computed(() => {
  if (kind.value === "replies") return "回复我的";
  if (kind.value === "mentions") return "@ 我的";
  return "系统通知";
});
const state = computed(() => {
  if (isPending.value) return "loading" as const;
  if (error.value) return "error" as const;
  if ((data.value?.length ?? 0) === 0) return "empty" as const;
  return null;
});
const errorMessage = computed(() =>
  error.value ? normalizeApiError(error.value).message : undefined,
);

function toPage(nextPage: number) {
  return { path: route.path, query: nextPage > 1 ? { page: nextPage } : {} };
}

function markAllRead() {
  readAll.mutate({ kind: kind.value, authScope: authScope.value });
}
</script>

<template>
  <section class="space-y-4">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold">{{ title }}</h1>
        <p class="text-sm text-cc98-text-muted">未读 {{ notificationCount(counts, kind) }}</p>
      </div>
      <button
        type="button"
        class="rounded border border-cc98-border px-3 py-1.5 text-sm disabled:opacity-50"
        :disabled="notificationCount(counts, kind) === 0 || readAll.isPending.value"
        @click="markAllRead"
      >
        {{ readAll.isPending.value ? "处理中…" : "全部标为已读" }}
      </button>
    </header>

    <p v-if="readAll.error.value" class="text-sm text-cc98-accent">
      {{ normalizeApiError(readAll.error.value).message }}
    </p>

    <PageState
      v-if="state"
      :kind="state"
      :message="state === 'empty' ? '当前分类没有通知。' : errorMessage"
      :show-retry="state === 'error'"
      @retry="refetch()"
    />

    <template v-else>
      <div class="space-y-3">
        <article
          v-for="item in data"
          :key="item.id"
          class="cc98-card p-4 space-y-2"
          :class="item.isRead ? '' : 'border-cc98-primary'"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2 text-sm">
              <span v-if="!item.isRead" class="h-2 w-2 rounded-full bg-cc98-primary" />
              <RouterLink v-if="item.board?.id" :to="`/list/${item.board.id}`" class="cc98-link">
                {{ item.board.name ?? `版面 ${item.board.id}` }}
              </RouterLink>
              <span v-else-if="item.title" class="font-medium">{{ item.title }}</span>
            </div>
            <time class="text-xs text-cc98-text-muted">{{
              dayjs(item.time).format("YYYY-MM-DD HH:mm")
            }}</time>
          </div>

          <ContentRenderer
            v-if="item.kind === 'system'"
            :content="notificationDescription(item)"
            type="ubb"
            :options="{ allowMediaContent: false, allowToolbox: false, maxImageCount: 3 }"
          />
          <RouterLink
            v-else-if="notificationTopicPath(item)"
            :to="notificationTopicPath(item)!"
            :class="item.isRead ? 'text-cc98-text-muted' : 'font-medium'"
          >
            {{ notificationDescription(item) }}
          </RouterLink>
          <p v-else class="text-cc98-text-muted">{{ notificationDescription(item) }}</p>
          <RouterLink
            v-if="item.kind === 'system' && notificationTopicPath(item)"
            :to="notificationTopicPath(item)!"
            class="cc98-link inline-block text-sm"
          >
            查看相关主题
          </RouterLink>
        </article>
      </div>

      <Pagination
        :current-page="page"
        :has-next-page="(data?.length ?? 0) >= PAGE_SIZE"
        :to-page="toPage"
      />
    </template>
  </section>
</template>
