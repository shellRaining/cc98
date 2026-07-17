<script setup lang="ts">
import { computed } from "vue";
import { useTitle } from "@vueuse/core";
import { useQuery } from "@tanstack/vue-query";
import { useRoute, useRouter } from "vue-router";
import { boardsByIdsQuery, globalTagsQuery, hotTopicsQuery, usersByIdsQuery } from "../api/queries";
import NewTopicClassicItem from "../components/discovery/NewTopicClassicItem.vue";
import PageState from "../components/PageState.vue";
import { normalizeApiError } from "../lib/api-error";
import {
  HOT_PERIOD_LABELS,
  isHotPeriod,
  uniqueTopicBoardIds,
  uniqueTopicUserIds,
  type HotPeriod,
} from "../lib/discovery";
import { saveLoginRedirect } from "../lib/login-redirect";

const route = useRoute();
const router = useRouter();

const period = computed<HotPeriod>(() => {
  const meta = route.meta.hotPeriod;
  return isHotPeriod(meta) ? meta : "monthly";
});

const title = computed(() => HOT_PERIOD_LABELS[period.value]);
useTitle(computed(() => `${title.value} - CC98 论坛`));

const options = computed(() => hotTopicsQuery(period.value));
const { data: topics, error, isPending, refetch } = useQuery(options);
const boardIds = computed(() => uniqueTopicBoardIds(topics.value ?? []));
const authorIds = computed(() => uniqueTopicUserIds(topics.value ?? []));
const boardsOptions = computed(() => boardsByIdsQuery(boardIds.value, boardIds.value.length > 0));
const authorsOptions = computed(() => usersByIdsQuery(authorIds.value, authorIds.value.length > 0));
const { data: boards } = useQuery(boardsOptions);
const { data: authors } = useQuery(authorsOptions);
const { data: tags } = useQuery(globalTagsQuery);
const boardMap = computed(() => new Map((boards.value ?? []).map((board) => [board.id, board])));
const authorMap = computed(
  () => new Map((authors.value ?? []).map((author) => [author.id, author])),
);
const tagMap = computed(() => new Map((tags.value ?? []).map((tag) => [tag.id, tag.name])));

const pageError = computed(() => (error.value ? normalizeApiError(error.value) : null));

const stateKind = computed(() => {
  if (isPending.value) return "loading" as const;
  if (pageError.value?.kind === "unauthorized") return "unauthorized" as const;
  if (pageError.value?.kind === "forbidden") return "forbidden" as const;
  if (pageError.value?.kind === "not-found") return "not-found" as const;
  if (pageError.value) return "error" as const;
  if ((topics.value?.length ?? 0) === 0) return "empty" as const;
  return null;
});

function goLogin() {
  saveLoginRedirect(route.fullPath);
  void router.push({ name: "logon" });
}

function topicTags(topic: { tag1?: number | null; tag2?: number | null }) {
  return [topic.tag1, topic.tag2].flatMap((id) =>
    id != null && id > 0 ? [tagMap.value.get(id) || String(id)] : [],
  );
}
</script>

<template>
  <section class="hot-topics-page">
    <nav class="hot-topics-breadcrumb" aria-label="面包屑">
      <RouterLink to="/">首页</RouterLink>
      <span aria-hidden="true">›</span>
      <span>{{ title }}</span>
    </nav>

    <PageState
      v-if="stateKind"
      :kind="stateKind"
      :message="pageError?.message"
      :show-retry="stateKind === 'error'"
      @login="goLogin"
      @retry="refetch()"
    />

    <div v-else class="new-topic-classic-list hot-topics-list">
      <NewTopicClassicItem
        v-for="topic in topics"
        :key="topic.id"
        :topic="topic"
        :board="topic.boardId ? boardMap.get(topic.boardId) : undefined"
        :author="topic.userId ? authorMap.get(topic.userId) : undefined"
        :tag-names="topicTags(topic)"
        time-format="absolute"
      />
    </div>
  </section>
</template>

<style scoped>
.hot-topics-page {
  min-height: 48.75rem;
  padding-bottom: 3.75rem;
}

.hot-topics-breadcrumb {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 1rem;
  color: var(--cc98-color-text-muted);
  font-size: 1rem;
}

.hot-topics-breadcrumb a,
.hot-topics-breadcrumb a:visited {
  color: var(--cc98-color-text-muted);
}

.hot-topics-breadcrumb a:hover {
  color: var(--cc98-color-primary);
}

.hot-topics-list {
  margin-top: 0;
}
</style>
