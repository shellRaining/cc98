<script setup lang="ts">
import type { User } from "@cc98/api";
import { useQuery } from "@tanstack/vue-query";
import { computed, ref } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { useFollowUserMutation, useUnfollowUserMutation } from "../../api/mutations";
import { currentUserQuery, fullUsersByIdsQuery, meRelationIdsQuery } from "../../api/queries";
import PageState from "../../components/PageState.vue";
import Pagination from "../../components/Pagination.vue";
import { normalizeApiError } from "../../lib/api-error";
import { pageToFrom } from "../../lib/route-params";
import {
  orderByIds,
  pageCount,
  parseUserCenterPage,
  userCenterPagePath,
} from "../../lib/user-center";
import { useUserStore } from "../../stores/user";

const PAGE_SIZE = 10;
const DEFAULT_AVATAR = "/static/images/default_avatar_boy.png";
const route = useRoute();
const user = useUserStore();
const page = computed(() => parseUserCenterPage(route.query.page));
const authScope = computed(() => user.user?.id ?? "anonymous");

const meQuery = useQuery(currentUserQuery);
const relationOptions = computed(() =>
  meRelationIdsQuery("followers", authScope.value, pageToFrom(page.value, PAGE_SIZE), PAGE_SIZE),
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
const rows = computed<Array<User & { id: number }>>(() =>
  orderByIds(relationQuery.data.value ?? [], usersQuery.data.value ?? []),
);
const totalPages = computed(() => pageCount(meQuery.data.value?.fanCount, PAGE_SIZE));

const followUser = useFollowUserMutation();
const unfollowUser = useUnfollowUserMutation();
const followingOverrides = ref(new Map<number, boolean>());
const unfollowedInSession = ref(new Set<number>());
const actionMessages = ref(new Map<number, string>());
const pendingUserId = ref(0);
const hoveredUserId = ref(0);

function isFollowing(profile: User & { id: number }): boolean {
  return followingOverrides.value.get(profile.id) ?? profile.isFollowing ?? false;
}

function buttonLabel(profile: User & { id: number }): string {
  if (pendingUserId.value === profile.id) return isFollowing(profile) ? "取关中" : "关注中";
  const message = actionMessages.value.get(profile.id);
  if (message) return message;
  if (isFollowing(profile)) return hoveredUserId.value === profile.id ? "取消关注" : "已关注";
  return unfollowedInSession.value.has(profile.id) ? "重新关注" : "关注";
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

function setUnfollowedInSession(userId: number, value: boolean) {
  const next = new Set(unfollowedInSession.value);
  if (value) next.add(userId);
  else next.delete(userId);
  unfollowedInSession.value = next;
}

async function toggleFollowing(profile: User & { id: number }) {
  if (pendingUserId.value) return;
  const wasFollowing = isFollowing(profile);
  pendingUserId.value = profile.id;
  setActionMessage(profile.id);
  try {
    if (wasFollowing) await unfollowUser.mutateAsync(profile.id);
    else await followUser.mutateAsync(profile.id);
    setFollowingOverride(profile.id, !wasFollowing);
    setUnfollowedInSession(profile.id, wasFollowing);
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
  <div class="user-content-page user-followers">
    <PageState v-if="relationQuery.isPending.value || usersQuery.isPending.value" kind="loading" />
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
    <p v-else-if="rows.length === 0" class="user-content-empty">没有粉丝</p>
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
            :class="{ 'is-unfollowed': !isFollowing(profile) }"
            :disabled="pendingUserId !== 0"
            @mouseenter="hoveredUserId = profile.id"
            @mouseleave="hoveredUserId = 0"
            @click="toggleFollowing(profile)"
          >
            {{ buttonLabel(profile) }}
          </button>
          <RouterLink :to="`/messages/private/${profile.id}`" class="user-relation__message">
            私信
          </RouterLink>
        </li>
      </ul>
      <Pagination
        :current-page="page"
        :total-pages="totalPages"
        :to-page="(target) => userCenterPagePath('/usercenter/followers', target)"
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
