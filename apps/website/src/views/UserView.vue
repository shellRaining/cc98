<script setup lang="ts">
import { useInfiniteQuery, useQuery } from "@tanstack/vue-query";
import { useIntersectionObserver, useTitle } from "@vueuse/core";
import dayjs from "dayjs";
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useFollowUserMutation, useUnfollowUserMutation } from "../api/mutations";
import {
  boardsByIdsQuery,
  userByIdQuery,
  userByNameQuery,
  userRecentTopicsInfiniteQuery,
} from "../api/queries";
import PageState from "../components/PageState.vue";
import UserProfileOverview from "../components/user/UserProfileOverview.vue";
import { normalizeApiError } from "../lib/api-error";
import { userIdPath } from "../lib/discovery";
import { saveLoginRedirect } from "../lib/login-redirect";
import { isSiteAdministrator } from "../lib/site-manage";
import { parsePositiveInt } from "../lib/route-params";
import { useUserStore } from "../stores/user";

const props = defineProps<{
  userId?: string;
  userName?: string;
}>();

const PAGE_SIZE = 10;
const route = useRoute();
const router = useRouter();
const user = useUserStore();
const followUser = useFollowUserMutation();
const unfollowUser = useUnfollowUserMutation();
const loadTarget = ref<HTMLElement | null>(null);

const numericUserId = computed(() => parsePositiveInt(props.userId));
const lookupName = computed(() => decodeURIComponent(props.userName ?? "").trim());
const lookingUpByName = computed(() => Boolean(lookupName.value) && numericUserId.value == null);
const invalidId = computed(() => !lookingUpByName.value && numericUserId.value == null);
const authScope = computed(() => user.user?.id ?? "anonymous");

const byIdQuery = useQuery(
  computed(() =>
    userByIdQuery(numericUserId.value ?? 0, authScope.value, numericUserId.value != null),
  ),
);
const byNameQuery = useQuery(
  computed(() => userByNameQuery(lookupName.value, authScope.value, lookingUpByName.value)),
);
const profile = computed(() => byIdQuery.data.value ?? byNameQuery.data.value ?? null);
const profileId = computed(() => profile.value?.id ?? numericUserId.value ?? 0);
const isSelf = computed(() => profileId.value === user.user?.id);
const relationPending = computed(() => followUser.isPending.value || unfollowUser.isPending.value);

useTitle(
  computed(() =>
    profile.value ? `${profile.value.name} - 用户详情 - CC98论坛` : "用户详情 - CC98论坛",
  ),
);

watch(
  () => profile.value?.id,
  (id) => {
    if (!lookingUpByName.value || id == null) return;
    void router.replace(userIdPath(id));
  },
);

const recentQuery = useInfiniteQuery(
  computed(() =>
    userRecentTopicsInfiniteQuery(
      profileId.value,
      authScope.value,
      PAGE_SIZE,
      user.isLoggedIn && profileId.value > 0,
    ),
  ),
);
const recentTopics = computed(() => recentQuery.data.value?.pages.flatMap((page) => page) ?? []);
const boardIds = computed(() => recentTopics.value.map((topic) => topic.boardId ?? 0));
const boardQuery = useQuery(computed(() => boardsByIdsQuery(boardIds.value)));
const boardMap = computed(
  () => new Map(boardQuery.data.value?.map((board) => [board.id, board]) ?? []),
);

const profileState = computed(() => {
  if (invalidId.value) return "not-found" as const;
  if (
    (lookingUpByName.value && byNameQuery.isPending.value) ||
    (numericUserId.value != null && byIdQuery.isPending.value)
  ) {
    return "loading" as const;
  }
  const error = byIdQuery.error.value ?? byNameQuery.error.value;
  if (error) return normalizeApiError(error).kind;
  if (!profile.value) return "not-found" as const;
  return null;
});

const profileError = computed(() => {
  const error = byIdQuery.error.value ?? byNameQuery.error.value;
  return error ? normalizeApiError(error).message : undefined;
});

const recentState = computed(() => {
  if (!user.isLoggedIn) return "empty" as const;
  if (recentQuery.isPending.value) return "loading" as const;
  if (recentQuery.error.value) return normalizeApiError(recentQuery.error.value).kind;
  if (recentTopics.value.length === 0) return "empty" as const;
  return null;
});

useIntersectionObserver(loadTarget, ([entry]) => {
  if (
    !entry?.isIntersecting ||
    !recentQuery.hasNextPage.value ||
    recentQuery.isFetchingNextPage.value
  ) {
    return;
  }
  void recentQuery.fetchNextPage();
});

function formatTime(value: string | undefined): string {
  if (!value) return "—";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD HH:mm") : value;
}

function goLogin() {
  saveLoginRedirect(route.fullPath);
  void router.push({ name: "logon" });
}

function retryProfile() {
  if (lookingUpByName.value) void byNameQuery.refetch();
  else void byIdQuery.refetch();
}

function toggleFollow() {
  const id = profile.value?.id;
  if (!id || isSelf.value || relationPending.value) return;
  if (!user.isLoggedIn) return goLogin();
  if (profile.value?.isFollowing) unfollowUser.mutate(id);
  else followUser.mutate(id);
}
</script>

<template>
  <section class="user-center-page user-detail-page">
    <h1 class="user-center-page__title">用户详情</h1>

    <PageState
      v-if="profileState"
      :kind="profileState"
      :message="profileError"
      :show-retry="profileState === 'error'"
      @login="goLogin"
      @retry="retryProfile"
    />

    <div v-else-if="profile" class="user-center-shell">
      <nav class="user-center-nav user-detail-nav" aria-label="用户详情">
        <ul>
          <li>
            <RouterLink :to="`/user/id/${profile.id}`" class="is-active">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3 3 11v12h6v-9h6v9h6V11z" />
              </svg>
              <span>主页</span>
            </RouterLink>
          </li>
          <li v-if="isSelf">
            <RouterLink to="/usercenter">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M4 21v-2a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8"
                />
              </svg>
              <span>个人中心</span>
            </RouterLink>
          </li>
          <li v-if="isSiteAdministrator(user.user?.privilege)">
            <RouterLink :to="`/user/id/${profile.id}/manage`">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8m9 4-2.1 1.2.1 2.4-2.1 2.1-2.4-.1L12 21l-1.2-2.1-2.4.1-2.1-2.1.1-2.4L4 12l2.1-1.2-.1-2.4 2.1-2.1 2.4.1L12 4l1.2 2.1 2.4-.1 2.1 2.1-.1 2.4z"
                />
              </svg>
              <span>管理</span>
            </RouterLink>
          </li>
        </ul>
      </nav>

      <main class="user-center-main">
        <div class="user-center-profile">
          <UserProfileOverview :profile="profile">
            <template v-if="!isSelf" #actions>
              <div class="user-detail-actions">
                <RouterLink v-if="user.isLoggedIn" :to="`/messages/private/${profile.id}`">
                  私信
                </RouterLink>
                <button v-else type="button" @click="goLogin">私信</button>
                <button
                  type="button"
                  :class="{ 'is-following': profile.isFollowing }"
                  :disabled="relationPending"
                  @click="toggleFollow"
                >
                  {{ profile.isFollowing ? "取消关注" : "关注" }}
                </button>
              </div>
            </template>
          </UserProfileOverview>

          <p
            v-if="followUser.error.value || unfollowUser.error.value"
            class="user-detail-relation-error"
          >
            {{ normalizeApiError(followUser.error.value ?? unfollowUser.error.value).message }}
          </p>

          <section class="user-center-activities">
            <header>
              <h2>发表的主题</h2>
            </header>

            <PageState
              v-if="recentState && recentState !== 'empty'"
              :kind="recentState"
              :show-retry="recentState === 'error'"
              @login="goLogin"
              @retry="recentQuery.refetch()"
            />
            <p v-else-if="recentState === 'empty'" class="user-center-activities__empty">
              没有主题
            </p>
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

            <div ref="loadTarget" class="user-detail-load-target">
              <span v-if="recentQuery.isFetchingNextPage.value">正在加载</span>
              <span v-else-if="!recentQuery.hasNextPage.value && recentTopics.length">
                没有更多主题了
              </span>
            </div>
          </section>
        </div>
      </main>
    </div>
  </section>
</template>
