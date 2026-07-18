<script setup lang="ts">
import { computed } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { useTitle } from "@vueuse/core";
import dayjs from "dayjs";
import { useRoute } from "vue-router";
import {
  allMessageCountsQuery,
  notificationsQuery,
  type NotificationKind,
} from "../../api/queries";
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
import { pageCount } from "../../lib/user-center";
import { useUserStore } from "../../stores/user";

const PAGE_SIZE = 10;
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
const { data: allCounts } = useQuery(
  computed(() => allMessageCountsQuery(authScope.value, user.isLoggedIn)),
);

const title = computed(() => {
  if (kind.value === "replies") return "回复我的";
  if (kind.value === "mentions") return "@ 我的";
  return "系统通知";
});
const totalPages = computed(() =>
  pageCount(notificationCount(allCounts.value, kind.value), PAGE_SIZE),
);
useTitle(computed(() => `${title.value} - CC98 论坛`));
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
</script>

<template>
  <section class="message-notification-page">
    <PageState
      v-if="state"
      :kind="state"
      :message="state === 'empty' ? '当前分类没有通知。' : errorMessage"
      :show-retry="state === 'error'"
      @retry="refetch()"
    />

    <template v-else>
      <div :class="kind === 'system' ? 'message-system-list' : 'message-notification-list'">
        <article v-for="item in data" :key="item.id" :class="{ 'is-unread': !item.isRead }">
          <div class="message-notification__bar">
            <span v-if="item.kind === 'system'">{{ item.title || "系统通知" }}</span>
            <RouterLink v-else-if="item.board?.id" :to="`/list/${item.board.id}`">
              {{ item.board.name ?? `版面 ${item.board.id}` }}
            </RouterLink>
            <span v-else>未知版面</span>
            <time>{{ dayjs(item.time).format("YYYY-MM-DD HH:mm:ss") }}</time>
          </div>

          <ContentRenderer
            v-if="item.kind === 'system'"
            class="message-notification__content"
            :content="notificationDescription(item)"
            type="ubb"
            :options="{ allowMediaContent: false, allowToolbox: false, maxImageCount: 3 }"
          />
          <p v-else class="message-notification__content">
            <RouterLink v-if="item.userId" :to="`/user/id/${item.userId}`">
              {{ item.userName || "有人" }}
            </RouterLink>
            <span v-else>{{ item.userName || "有人" }}</span>
            <span> 在《</span>
            <RouterLink v-if="notificationTopicPath(item)" :to="notificationTopicPath(item)!">
              {{ item.topic?.title?.trim() || "一个主题" }}
            </RouterLink>
            <span v-else>{{ item.topic?.title?.trim() || "一个主题" }}</span>
            <span>》中{{ item.kind === "replies" ? "回复了你。" : "提到了你。" }}</span>
          </p>
          <RouterLink
            v-if="item.kind === 'system' && notificationTopicPath(item)"
            :to="notificationTopicPath(item)!"
            class="message-notification__topic-link"
          >
            查看相关主题
          </RouterLink>
        </article>
      </div>

      <Pagination
        :current-page="page"
        :total-pages="totalPages"
        :to-page="toPage"
        variant="user-center"
      />
    </template>
  </section>
</template>

<style scoped>
.message-notification-list,
.message-system-list {
  min-height: 59.5rem;
  border: 1px solid var(--cc98-color-border);
  background: var(--cc98-color-surface);
}

.message-notification-list article,
.message-system-list article {
  padding: 0 1.875rem 1.25rem;
  border-bottom: 1px dashed var(--cc98-color-border);
}

.message-notification__bar {
  display: flex;
  height: 3.125rem;
  align-items: center;
  font-size: 0.875rem;
}

.message-notification__bar > a {
  flex: 0 0 auto;
  margin-right: 0.625rem;
  color: #1e90ff;
}

.message-notification__bar > span {
  flex: 0 0 auto;
  margin-right: 0.625rem;
  color: var(--cc98-color-text);
  font-size: 0.9375rem;
}

.message-notification__bar time {
  color: var(--cc98-color-text-muted);
  font-size: 0.75rem;
}

.message-notification__content,
.message-notification__content:visited {
  display: block;
  min-height: 1.5rem;
  margin: 0;
  color: var(--cc98-color-text-muted);
  font-size: 0.875rem;
  line-height: 1.5rem;
}

.message-notification__content > a {
  color: inherit;
}

.message-notification__content > a:hover {
  color: var(--cc98-color-primary);
}

article.is-unread .message-notification__content,
article.is-unread .message-notification__content:visited {
  color: var(--cc98-color-text);
  font-weight: 600;
}

.message-notification__topic-link {
  display: inline-block;
  margin-top: 0.25rem;
  color: var(--cc98-color-primary);
  font-size: 0.75rem;
}

.message-notification-page > :deep(.user-center-pagination) {
  margin-top: 0.625rem;
}
</style>
