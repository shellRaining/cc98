<script setup lang="ts">
import { computed } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { useRoute, useRouter } from "vue-router";
import { boardsByIdsQuery, mePostsQuery } from "../../api/queries";
import PageState from "../../components/PageState.vue";
import Pagination from "../../components/Pagination.vue";
import PostSummaryList from "../../components/PostSummaryList.vue";
import { normalizeApiError } from "../../lib/api-error";
import { pageToFrom } from "../../lib/route-params";
import {
  normalizeMePostKind,
  pageCount,
  parseUserCenterPage,
  userCenterPagePath,
} from "../../lib/user-center";
import { useUserStore } from "../../stores/user";

const PAGE_SIZE = 10;
const route = useRoute();
const router = useRouter();
const user = useUserStore();
const page = computed(() => parseUserCenterPage(route.query.page));
const kind = computed(() => normalizeMePostKind(route.query.kind));
const authScope = computed(() => user.user?.id ?? "anonymous");
const options = computed(() =>
  mePostsQuery(kind.value, authScope.value, pageToFrom(page.value, PAGE_SIZE), PAGE_SIZE),
);
const { data, error, isPending, refetch } = useQuery(options);
const posts = computed(() => data.value?.data ?? []);
const boardIds = computed(() =>
  posts.value.flatMap((post) => (post.boardId == null ? [] : [post.boardId])),
);
const boardOptions = computed(() => boardsByIdsQuery(boardIds.value, boardIds.value.length > 0));
const { data: boards } = useQuery(boardOptions);
const boardNames = computed(
  () =>
    new Map(
      (boards.value ?? []).flatMap((board) =>
        board.id == null ? [] : [[board.id, board.name ?? `版面 ${board.id}`] as const],
      ),
    ),
);
const totalPages = computed(() => pageCount(data.value?.count, PAGE_SIZE));

function changeKind(event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  void router.push(userCenterPagePath("/usercenter/posts", 1, { kind: value }));
}
</script>

<template>
  <div class="space-y-4">
    <header class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold">我的回复</h1>
        <p class="mt-1 text-sm text-cc98-text-muted">查看最近回复或收到较多关注的回复。</p>
      </div>
      <label class="text-sm text-cc98-text-muted">
        类型
        <select
          :value="kind"
          class="ml-2 rounded border border-cc98-border bg-cc98-bg px-2 py-1 text-cc98-text"
          @change="changeKind"
        >
          <option value="recent">最近回复</option>
          <option value="hot">热门回复</option>
        </select>
      </label>
    </header>
    <PageState v-if="isPending" kind="loading" />
    <PageState
      v-else-if="error"
      kind="error"
      :message="normalizeApiError(error).message"
      show-retry
      @retry="refetch()"
    />
    <PageState v-else-if="posts.length === 0" kind="empty" />
    <template v-else-if="posts.length > 0">
      <div class="cc98-card px-4"><PostSummaryList :posts="posts" :board-names="boardNames" /></div>
    </template>
    <Pagination
      v-if="!isPending && !error && (posts.length > 0 || page > 1)"
      :current-page="page"
      :total-pages="totalPages"
      :to-page="(target) => userCenterPagePath('/usercenter/posts', target, { kind })"
    />
  </div>
</template>
