<script setup lang="ts">
import type { User } from "@cc98/api";
import { useQuery } from "@tanstack/vue-query";
import { computed, ref, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { useFollowUserMutation, useUnfollowUserMutation } from "../../api/mutations";
import { currentUserQuery, fullUsersByIdsQuery, meRelationIdsQuery } from "../../api/queries";
import PageState from "../../components/PageState.vue";
import Pagination from "../../components/Pagination.vue";
import { normalizeApiError } from "../../lib/api-error";
import { pageCount, pageToFrom } from "../../lib/route-params";
import { useUserStore } from "../../stores/user";
import { parseUserCenterPage, userCenterPagePath } from "./navigation";

const PAGE_SIZE = 10;
const DEFAULT_AVATAR = "/static/images/default_avatar_boy.png";
const route = useRoute();
const user = useUserStore();
const page = computed(() => parseUserCenterPage(route.query.page));
const authScope = computed(() => user.user?.id ?? "anonymous");

const meQuery = useQuery(currentUserQuery);
const relationOptions = computed(() =>
  meRelationIdsQuery("following", authScope.value, pageToFrom(page.value, PAGE_SIZE), PAGE_SIZE),
);
const relationQuery = useQuery(relationOptions);
const userOptions = computed(() =>
  fullUsersByIdsQuery(
    relationQuery.data.value ?? [],
    authScope.value,
    (relationQuery.data.value?.length ?? 0) > 0,
  ),
);
const usersQuery = useQuery(userOptions);

const knownUsers = ref(new Map<number, User & { id: number }>());
const userOrder = ref<number[]>([]);
const followingOverrides = ref(new Map<number, boolean>());
const actionMessages = ref(new Map<number, string>());
const pendingUserId = ref(0);
const hoveredUserId = ref(0);

watch(page, () => {
  knownUsers.value = new Map();
  userOrder.value = [];
  followingOverrides.value = new Map();
  actionMessages.value = new Map();
  pendingUserId.value = 0;
  hoveredUserId.value = 0;
});

watch(
  () => relationQuery.data.value,
  (ids) => {
    if (!ids) return;
    userOrder.value = [...userOrder.value, ...ids.filter((id) => !userOrder.value.includes(id))];
  },
  { immediate: true },
);

watch(
  () => usersQuery.data.value,
  (users) => {
    if (!users) return;
    const next = new Map(knownUsers.value);
    for (const profile of users) next.set(profile.id, profile);
    knownUsers.value = next;
  },
  { immediate: true },
);

const rows = computed<Array<User & { id: number }>>(() =>
  userOrder.value.flatMap((id) => {
    const profile = knownUsers.value.get(id);
    return profile ? [profile] : [];
  }),
);
const totalPages = computed(() => pageCount(meQuery.data.value?.followCount, PAGE_SIZE));
const followUser = useFollowUserMutation();
const unfollowUser = useUnfollowUserMutation();

function isFollowing(userId: number): boolean {
  return (
    followingOverrides.value.get(userId) ?? relationQuery.data.value?.includes(userId) ?? false
  );
}

function buttonLabel(userId: number): string {
  if (pendingUserId.value === userId) return isFollowing(userId) ? "取关中" : "关注中";
  const message = actionMessages.value.get(userId);
  if (message) return message;
  if (!isFollowing(userId)) return "重新关注";
  return hoveredUserId.value === userId ? "取消关注" : "已关注";
}

function setFollowingOverride(userId: number, value: boolean) {
  const next = new Map(followingOverrides.value);
  next.set(userId, value);
  followingOverrides.value = next;
}

function setActionMessage(userId: number, message?: string) {
  const next = new Map(actionMessages.value);
  if (message) next.set(userId, message);
  else next.delete(userId);
  actionMessages.value = next;
}

async function toggleFollowing(profile: User & { id: number }) {
  if (pendingUserId.value) return;
  const wasFollowing = isFollowing(profile.id);
  pendingUserId.value = profile.id;
  setActionMessage(profile.id);
  try {
    if (wasFollowing) await unfollowUser.mutateAsync(profile.id);
    else await followUser.mutateAsync(profile.id);
    setFollowingOverride(profile.id, !wasFollowing);
  } catch (error) {
    setActionMessage(profile.id, wasFollowing ? "取关失败" : "关注失败");
    void normalizeApiError(error);
  } finally {
    pendingUserId.value = 0;
  }
}

function replaceBrokenAvatar(event: Event) {
  const image = event.currentTarget as HTMLImageElement;
  if (!image.src.endsWith(DEFAULT_AVATAR)) image.src = DEFAULT_AVATAR;
}
</script>

<template>
  <div class="user-content-page user-following-users">
    <PageState
      v-if="(relationQuery.isPending.value || usersQuery.isPending.value) && rows.length === 0"
      kind="loading"
    />
    <PageState
      v-else-if="relationQuery.error.value || usersQuery.error.value"
      kind="error"
      :message="normalizeApiError(relationQuery.error.value || usersQuery.error.value).message"
      show-retry
      @retry="
        relationQuery.refetch();
        usersQuery.refetch();
      "
    />
    <p v-else-if="rows.length === 0" class="user-content-empty">没有关注</p>
    <template v-else>
      <ul class="user-relation-list">
        <li v-for="profile in rows" :key="profile.id">
          <RouterLink :to="`/user/id/${profile.id}`" class="user-relation__avatar">
            <img
              :src="profile.portraitUrl || profile.photourl || DEFAULT_AVATAR"
              :alt="`${profile.name} 的头像`"
              @error="replaceBrokenAvatar"
            />
          </RouterLink>
          <p class="user-relation__summary">
            <RouterLink :to="`/user/id/${profile.id}`" class="user-relation__name">
              {{ profile.name }}
            </RouterLink>
            <span>帖数</span>
            <strong class="user-relation__posts">{{ profile.postCount ?? 0 }}</strong>
            <span>粉丝</span>
            <strong class="user-relation__fans">{{ profile.fanCount ?? 0 }}</strong>
          </p>
          <button
            type="button"
            class="user-relation__follow"
            :class="{ 'is-unfollowed': !isFollowing(profile.id) }"
            :disabled="pendingUserId !== 0"
            @mouseenter="hoveredUserId = profile.id"
            @mouseleave="hoveredUserId = 0"
            @click="toggleFollowing(profile)"
          >
            {{ buttonLabel(profile.id) }}
          </button>
          <RouterLink :to="`/messages/private/${profile.id}`" class="user-relation__message">
            私信
          </RouterLink>
        </li>
      </ul>
      <Pagination
        :current-page="page"
        :total-pages="totalPages"
        :to-page="(target) => userCenterPagePath('/usercenter/following', target)"
        variant="user-center"
      />
    </template>
  </div>
</template>

<style scoped>
.user-content-page {
  min-height: 36rem;
}

.user-content-empty {
  margin: 2rem 0;
  color: var(--cc98-color-text-muted);
  text-align: center;
}

.user-relation-list {
  min-height: 40rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.user-relation-list li {
  display: flex;
  align-items: center;
  padding-bottom: 1.875rem;
}

.user-relation-list li + li {
  padding-top: 1.875rem;
  border-top: 1px dashed var(--cc98-color-border);
}

.user-relation__avatar {
  display: block;
  width: 3.75rem;
  height: 3.75rem;
  flex: 0 0 3.75rem;
  overflow: hidden;
  margin-right: 1.25rem;
  border-radius: 50%;
}

.user-relation__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-relation__summary {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  align-items: center;
  margin: 0;
  white-space: nowrap;
}

.user-relation__name {
  min-width: 7rem;
  margin-right: 1.25rem;
  overflow: hidden;
  color: var(--cc98-color-text);
  text-overflow: ellipsis;
}

.user-relation__name:hover {
  color: var(--cc98-color-primary);
}

.user-relation__summary strong {
  font-weight: 400;
}

.user-relation__posts {
  min-width: 2rem;
  margin: 0 0.88rem 0 0.75rem;
  color: #35a7ff;
}

.user-relation__fans {
  min-width: 2rem;
  margin: 0 0.88rem 0 0.75rem;
  color: #ff3636;
}

.user-relation__follow,
.user-relation__message {
  display: inline-flex;
  width: 4.375rem;
  height: 1.625rem;
  flex: 0 0 4.375rem;
  align-items: center;
  justify-content: center;
  margin: 0 1rem;
  border: 0;
  border-radius: 3px;
  background: #e6e6e6;
  color: #a0a0a0;
  font: inherit;
  font-size: 0.75rem;
  line-height: 1;
  cursor: pointer;
  transition: opacity 0.4s;
}

.user-relation__message,
.user-relation__follow.is-unfollowed {
  background: var(--cc98-color-primary);
  color: #fff;
}

.user-relation__follow:hover,
.user-relation__message:hover {
  opacity: 0.8;
}

.user-relation__follow:active,
.user-relation__message:active {
  opacity: 0.6;
}

.user-relation__follow:disabled {
  cursor: wait;
}
</style>
