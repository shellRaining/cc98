<script setup lang="ts">
import { computed } from "vue";
import { useQuery } from "@tanstack/vue-query";
import dayjs from "dayjs";
import { useRoute, useRouter } from "vue-router";
import { boardsByIdsQuery, mePostsQuery } from "../../api/queries";
import PageState from "../../components/PageState.vue";
import Pagination from "../../components/Pagination.vue";
import { normalizeApiError } from "../../lib/api-error";
import { pageToFrom } from "../../lib/route-params";
import {
  normalizeMePostKind,
  pageCount,
  parseUserCenterPage,
  postExcerpt,
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

function toggleKind() {
  const next = kind.value === "recent" ? "hot" : "recent";
  void router.push(userCenterPagePath("/usercenter/posts", 1, { kind: next }));
}

function formatTime(value: string | undefined): string {
  if (!value) return "—";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD HH:mm:ss") : value;
}

function postLink(post: (typeof posts.value)[number]): string {
  if (post.topicId == null) return "/";
  return post.floor != null && post.floor > 0
    ? `/topic/${post.topicId}#floor-${post.floor}`
    : `/topic/${post.topicId}`;
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
    <PageState v-else-if="posts.length === 0" kind="empty" message="没有回复" />
    <template v-else>
      <button type="button" class="user-content-toggle" @click="toggleKind">
        {{ kind === "recent" ? "显示热门回复" : "显示全部回复" }}
      </button>
      <ul class="user-content-list">
        <li v-for="post in posts" :key="post.id">
          <div class="user-content-list__meta user-content-list__meta--post">
            <time :datetime="post.time">{{ formatTime(post.time) }}</time>
            <span>赞：{{ post.likeCount ?? 0 }}</span>
            <span>踩：{{ post.dislikeCount ?? 0 }}</span>
            <RouterLink v-if="post.boardId" :to="`/list/${post.boardId}`">
              {{ boardNames.get(post.boardId) ?? `版面 ${post.boardId}` }}
            </RouterLink>
          </div>
          <RouterLink :to="postLink(post)" class="user-content-list__title">
            {{ postExcerpt(post.content, post.contentType) }}
          </RouterLink>
        </li>
      </ul>
    </template>
    <Pagination
      v-if="!isPending && !error && (posts.length > 0 || page > 1)"
      :current-page="page"
      :total-pages="totalPages"
      :to-page="(target) => userCenterPagePath('/usercenter/posts', target, { kind })"
      variant="user-center"
    />
  </div>
</template>
