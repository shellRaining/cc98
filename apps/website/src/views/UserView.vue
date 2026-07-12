<script setup lang="ts">
import { computed, watch } from "vue";
import { useInfiniteQuery, useQuery } from "@tanstack/vue-query";
import dayjs from "dayjs";
import { useRoute, useRouter } from "vue-router";
import { userByIdQuery, userByNameQuery, userRecentTopicsInfiniteQuery } from "../api/queries";
import LoadMore from "../components/LoadMore.vue";
import PageState from "../components/PageState.vue";
import TopicList from "../components/TopicList.vue";
import { normalizeApiError } from "../lib/api-error";
import { dedupeTopicsById, userIdPath } from "../lib/discovery";
import { saveLoginRedirect } from "../lib/login-redirect";
import { parsePositiveInt } from "../lib/route-params";
import { useUserStore } from "../stores/user";
import { useFollowUserMutation, useUnfollowUserMutation } from "../api/mutations";

const props = defineProps<{
  userId?: string;
  userName?: string;
}>();

const PAGE_SIZE = 20;
const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const followUser = useFollowUserMutation();
const unfollowUser = useUnfollowUserMutation();

const numericUserId = computed(() => parsePositiveInt(props.userId));
const lookupName = computed(() => decodeURIComponent(props.userName ?? "").trim());
const lookingUpByName = computed(() => Boolean(lookupName.value) && numericUserId.value == null);
const invalidId = computed(
  () => !lookingUpByName.value && numericUserId.value == null && !props.userName,
);

const authScope = computed(() => userStore.user?.id ?? "anonymous");

const byIdOptions = computed(() =>
  userByIdQuery(numericUserId.value ?? 0, authScope.value, numericUserId.value != null),
);

const byNameOptions = computed(() =>
  userByNameQuery(lookupName.value, authScope.value, lookingUpByName.value),
);

const {
  data: userById,
  error: idError,
  isPending: idPending,
  refetch: refetchById,
} = useQuery(byIdOptions);

const {
  data: userByName,
  error: nameError,
  isPending: namePending,
  refetch: refetchByName,
} = useQuery(byNameOptions);

const profile = computed(() => userById.value ?? userByName.value ?? null);
const isSelf = computed(() => profile.value?.id === userStore.user?.id);
const relationPending = computed(() => followUser.isPending.value || unfollowUser.isPending.value);

watch(
  () => profile.value?.id,
  (id) => {
    if (!lookingUpByName.value || id == null) return;
    void router.replace(userIdPath(id));
  },
);

const resolvedUserId = computed(() => profile.value?.id ?? numericUserId.value ?? 0);
const canLoadRecent = computed(
  () => userStore.isLoggedIn && resolvedUserId.value > 0 && profile.value != null,
);

const recentOptions = computed(() =>
  userRecentTopicsInfiniteQuery(
    resolvedUserId.value,
    authScope.value,
    PAGE_SIZE,
    canLoadRecent.value,
  ),
);

const {
  data: recentData,
  error: recentError,
  isPending: recentPending,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  refetch: refetchRecent,
} = useInfiniteQuery(recentOptions);

const recentTopics = computed(() =>
  dedupeTopicsById(recentData.value?.pages.flatMap((page) => page) ?? []),
);

const profileError = computed(() => {
  if (invalidId.value) return normalizeApiError({ status: 404 });
  if (idError.value) return normalizeApiError(idError.value);
  if (nameError.value) return normalizeApiError(nameError.value);
  return null;
});

const profileState = computed(() => {
  if (invalidId.value) return "not-found" as const;
  if (
    (lookingUpByName.value && namePending.value) ||
    (numericUserId.value != null && idPending.value)
  ) {
    return "loading" as const;
  }
  if (profileError.value?.kind === "unauthorized") return "unauthorized" as const;
  if (profileError.value?.kind === "forbidden") return "forbidden" as const;
  if (profileError.value?.kind === "not-found") return "not-found" as const;
  if (profileError.value) return "error" as const;
  if (!profile.value) return "not-found" as const;
  return null;
});

const recentState = computed(() => {
  if (profileState.value) return null;
  if (!userStore.isLoggedIn) return "unauthorized" as const;
  if (recentPending.value) return "loading" as const;
  if (recentError.value) {
    const err = normalizeApiError(recentError.value);
    if (err.kind === "unauthorized") return "unauthorized" as const;
    if (err.kind === "forbidden") return "forbidden" as const;
    if (err.kind === "not-found") return "not-found" as const;
    return "error" as const;
  }
  if (recentTopics.value.length === 0) return "empty" as const;
  return null;
});

const recentErrorMessage = computed(() =>
  recentError.value ? normalizeApiError(recentError.value).message : undefined,
);

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
  if (lookingUpByName.value) void refetchByName();
  else void refetchById();
}

function loadMore() {
  if (!hasNextPage.value || isFetchingNextPage.value) return;
  void fetchNextPage();
}

function toggleFollow() {
  const id = profile.value?.id;
  if (!id || isSelf.value || relationPending.value) return;
  if (!userStore.isLoggedIn) {
    goLogin();
    return;
  }
  if (profile.value?.isFollowing) unfollowUser.mutate(id);
  else followUser.mutate(id);
}
</script>

<template>
  <section class="space-y-6">
    <PageState
      v-if="profileState"
      :kind="profileState"
      :message="profileError?.message"
      :show-retry="profileState === 'error'"
      @login="goLogin"
      @retry="retryProfile"
    />

    <template v-else-if="profile">
      <header class="space-y-3">
        <div class="flex flex-wrap items-start gap-4">
          <img
            v-if="profile.portraitUrl"
            :src="profile.portraitUrl"
            :alt="`${profile.name} 的头像`"
            class="h-16 w-16 rounded object-cover border border-cc98-border"
          />
          <div class="space-y-1 min-w-0">
            <h1 class="text-2xl font-bold break-all">{{ profile.name }}</h1>
            <p
              v-if="profile.displayTitle || profile.levelTitle"
              class="text-sm text-cc98-text-muted"
            >
              {{ profile.displayTitle || profile.levelTitle }}
            </p>
            <p class="text-xs text-cc98-text-muted">
              帖数 {{ profile.postCount ?? "—" }} · 威望 {{ profile.prestige ?? "—" }} · 粉丝
              {{ profile.fanCount ?? "—" }} · 关注 {{ profile.followCount ?? "—" }}
            </p>
            <p class="text-xs text-cc98-text-muted">
              注册 {{ formatTime(profile.registerTime) }} · 上次登录
              {{ formatTime(profile.lastLogOnTime) }}
            </p>
          </div>
          <div v-if="!isSelf" class="ml-auto flex flex-wrap gap-2">
            <button
              type="button"
              class="rounded border border-cc98-border px-3 py-1.5 text-sm disabled:opacity-50"
              :disabled="relationPending"
              @click="toggleFollow"
            >
              {{ profile.isFollowing ? "取消关注" : "关注" }}
            </button>
            <RouterLink
              v-if="profile.id && userStore.isLoggedIn"
              :to="`/messages/private/${profile.id}`"
              class="rounded bg-cc98-primary px-3 py-1.5 text-sm text-white"
            >
              发私信
            </RouterLink>
            <button
              v-else-if="profile.id"
              type="button"
              class="rounded bg-cc98-primary px-3 py-1.5 text-sm text-white"
              @click="goLogin"
            >
              发私信
            </button>
          </div>
        </div>
        <p
          v-if="followUser.error.value || unfollowUser.error.value"
          class="text-sm text-cc98-accent"
        >
          {{ normalizeApiError(followUser.error.value ?? unfollowUser.error.value).message }}
        </p>
        <p
          v-if="profile.introduction?.trim()"
          class="text-sm text-cc98-text-muted whitespace-pre-wrap"
        >
          {{ profile.introduction.trim() }}
        </p>
      </header>

      <section class="space-y-3">
        <h2 class="text-lg font-semibold">近期主题</h2>

        <PageState
          v-if="recentState"
          :kind="recentState"
          :message="
            recentState === 'unauthorized'
              ? '登录后可查看该用户的近期主题。'
              : recentState === 'empty'
                ? '暂无近期主题。'
                : recentErrorMessage
          "
          :show-retry="recentState === 'error'"
          @login="goLogin"
          @retry="refetchRecent()"
        />

        <template v-else>
          <div class="cc98-card px-4">
            <TopicList :topics="recentTopics" />
          </div>
          <LoadMore
            :has-more="Boolean(hasNextPage)"
            :loading="isFetchingNextPage"
            @load-more="loadMore"
          />
        </template>
      </section>
    </template>
  </section>
</template>
