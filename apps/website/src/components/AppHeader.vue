<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { topicQuery, unreadCountsQuery } from "../api/queries";
import {
  normalizeSearchBoardId,
  searchBoardsPath,
  searchTopicsPath,
  userNamePath,
} from "../router/links";
import { saveLoginRedirect } from "../lib/login-redirect";
import { isSiteAdministrator, useUserStore } from "../stores/user";
import UiBadge from "./ui/Badge.vue";

type SearchKind = "topic" | "within" | "user" | "board";

const user = useUserStore();
const route = useRoute();
const router = useRouter();
const keyword = ref("");
const searchKind = ref<SearchKind>("topic");
const isHome = computed(() => route.name === "home");
const authScope = computed(() => user.user?.id ?? "anonymous");
const routeTopicId = computed(() => {
  if (route.name !== "topic") return 0;
  const value = Number(route.params.topicId);
  return Number.isInteger(value) && value > 0 ? value : 0;
});
const topicOptions = computed(() =>
  topicQuery(routeTopicId.value, authScope.value, routeTopicId.value > 0),
);
const { data: currentTopic } = useQuery(topicOptions);
const contextBoardId = computed(() => {
  if (route.name === "board") return normalizeSearchBoardId(String(route.params.boardId ?? ""));
  if (route.name === "topic") return currentTopic.value?.boardId ?? null;
  if (route.name === "search-topics") {
    return normalizeSearchBoardId(String(route.query.boardId ?? ""));
  }
  return null;
});
const hasBoardContext = computed(() => contextBoardId.value != null);
const { data: unreadCounts } = useQuery(
  computed(() => unreadCountsQuery(authScope.value, user.isLoggedIn)),
);
const unreadTotal = computed(() => {
  const counts = unreadCounts.value;
  return counts ? counts.systemCount + counts.atCount + counts.replyCount + counts.messageCount : 0;
});
const isAdministrator = computed(() => isSiteAdministrator(user.user?.privilege));

watch(
  hasBoardContext,
  (hasContext) => {
    if (hasContext && searchKind.value === "topic") searchKind.value = "within";
    if (!hasContext && searchKind.value === "within") searchKind.value = "topic";
  },
  { immediate: true },
);

function goLogin(event?: Event) {
  event?.preventDefault();
  saveLoginRedirect(route.fullPath);
  void router.push({ name: "logon" });
}

function submitSearch() {
  const value = keyword.value.trim();
  if (!value) return;
  if (searchKind.value === "board") void router.push(searchBoardsPath(value));
  else if (searchKind.value === "user") void router.push(userNamePath(value));
  else if (searchKind.value === "within" && contextBoardId.value != null) {
    void router.push(searchTopicsPath(value, contextBoardId.value));
  } else void router.push(searchTopicsPath(value));
}
</script>

<template>
  <header class="site-header" :class="{ 'site-header--home': isHome }">
    <div class="site-header__topbar">
      <div class="cc98-content site-header__row">
        <div class="site-header__left">
          <RouterLink to="/" class="site-header__brand" aria-label="CC98 论坛首页">
            <img src="/static/images/98LOGO.ico" alt="" />
            <span>CC98论坛</span>
          </RouterLink>
          <span class="site-header__separator" aria-hidden="true">|</span>
          <nav class="site-header__nav" aria-label="主导航">
            <RouterLink to="/boardlist">版面列表</RouterLink>
            <RouterLink to="/newtopics">新帖</RouterLink>
            <RouterLink to="/focus">关注</RouterLink>
            <RouterLink to="/recommendedtopics">精选</RouterLink>
          </nav>
          <form class="header-search" role="search" @submit.prevent="submitSearch">
            <label class="sr-only" for="header-search-kind">搜索类型</label>
            <select id="header-search-kind" v-model="searchKind">
              <option v-if="hasBoardContext" value="within">版内</option>
              <option value="topic">{{ hasBoardContext ? "全站" : "主题" }}</option>
              <option value="user">用户</option>
              <option value="board">版面</option>
            </select>
            <input
              v-model="keyword"
              type="search"
              placeholder="请输入搜索内容"
              aria-label="搜索内容"
            />
            <button type="submit" aria-label="搜索">
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path
                  d="m21 20-4.4-4.4a7.5 7.5 0 1 0-1.4 1.4l4.4 4.4L21 20ZM5 11.5a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0Z"
                />
              </svg>
            </button>
          </form>
        </div>

        <div class="site-header__account">
          <template v-if="user.isLoggedIn">
            <div class="site-header__message-menu">
              <RouterLink
                to="/messages/replies"
                class="site-header__message-trigger"
                :aria-label="unreadTotal > 0 ? `消息，${unreadTotal} 条未读` : '消息'"
              >
                <span class="site-header__message-bell" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
                  </svg>
                </span>
                <UiBadge class="site-header__message-total" :count="unreadTotal" />
              </RouterLink>
              <nav class="site-header__message-dropdown" aria-label="消息分类">
                <RouterLink to="/messages/replies">
                  <span>回复我的</span>
                  <UiBadge
                    class="site-header__message-count"
                    :count="unreadCounts?.replyCount ?? 0"
                  />
                </RouterLink>
                <RouterLink to="/messages/mentions">
                  <span>@ 我的</span>
                  <UiBadge class="site-header__message-count" :count="unreadCounts?.atCount ?? 0" />
                </RouterLink>
                <RouterLink to="/messages/system">
                  <span>系统通知</span>
                  <UiBadge
                    class="site-header__message-count"
                    :count="unreadCounts?.systemCount ?? 0"
                  />
                </RouterLink>
                <RouterLink to="/messages/private">
                  <span>我的私信</span>
                  <UiBadge
                    class="site-header__message-count"
                    :count="unreadCounts?.messageCount ?? 0"
                  />
                </RouterLink>
              </nav>
            </div>
            <div class="site-header__user-menu">
              <RouterLink to="/usercenter" class="site-header__user">
                <img v-if="user.user?.avatarUrl" :src="user.user.avatarUrl" alt="" />
                <span>{{ user.user?.name }}</span>
              </RouterLink>
              <nav class="site-header__user-dropdown" aria-label="用户菜单">
                <RouterLink to="/usercenter">个人中心</RouterLink>
                <RouterLink v-if="isAdministrator" to="/sitemanage">全站管理</RouterLink>
                <RouterLink to="/signin">签到</RouterLink>
                <button type="button" @click="user.logout()">退出登录</button>
              </nav>
            </div>
          </template>
          <template v-else>
            <RouterLink to="/logon" @click="goLogin">登录</RouterLink>
            <a href="https://account.cc98.org/" target="_blank" rel="noopener noreferrer">注册</a>
          </template>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.site-header {
  position: relative;
  height: 3rem;
  margin-bottom: 1.25rem;
  background: var(--cc98-color-primary);
}

.site-header--home {
  height: var(--cc98-banner-height);
  background-color: var(--cc98-color-primary);
  background-image: var(--cc98-banner-image);
  background-repeat: no-repeat;
  background-position: center;
  background-size: auto 12rem;
}

.site-header__topbar {
  position: absolute;
  inset: 0 0 auto;
  z-index: 10;
  height: 3rem;
  background: var(--cc98-color-topbar);
  color: #fff;
}

.site-header__row,
.site-header__left,
.site-header__nav,
.site-header__account,
.site-header__brand,
.site-header__user {
  display: flex;
  align-items: center;
}

.site-header__row {
  height: 3rem;
  justify-content: space-between;
  gap: 1rem;
}

.site-header__left {
  min-width: 0;
  gap: 0.9rem;
}

.site-header__brand {
  flex: none;
  gap: 0.75rem;
  font-size: 1.25rem;
  white-space: nowrap;
}

.site-header__brand img {
  width: 2.125rem;
  height: 1.5rem;
  object-fit: contain;
}

.site-header__separator {
  opacity: 0.85;
}

.site-header__nav {
  flex: none;
  gap: 1rem;
  white-space: nowrap;
}

.site-header a,
.site-header a:visited,
.site-header button {
  color: #fff;
}

.site-header a:hover,
.site-header button:hover {
  color: #fff;
  text-decoration: underline;
}

.header-search {
  display: flex;
  align-items: center;
  width: 30rem;
  height: 1.5rem;
  margin-left: 0.25rem;
  overflow: hidden;
  border-radius: 0.625rem;
  background: #fff;
  color: var(--cc98-color-primary);
}

.header-search select,
.header-search input,
.header-search button {
  height: 100%;
  border: 0;
  background: transparent;
  color: var(--cc98-color-primary);
  font: inherit;
  font-size: 0.75rem;
  outline: none;
}

.header-search select {
  width: 4.25rem;
  padding-left: 0.75rem;
  cursor: pointer;
}

.header-search input {
  min-width: 0;
  flex: 1;
  padding-inline: 0.5rem;
}

.header-search button {
  display: grid;
  width: 2.25rem;
  place-items: center;
  cursor: pointer;
}

.header-search button:hover {
  color: var(--cc98-color-primary-hover);
  text-decoration: none;
}

.header-search svg {
  width: 1rem;
  height: 1rem;
  fill: currentcolor;
}

.site-header__account {
  flex: none;
  gap: 0.9rem;
  white-space: nowrap;
}

.site-header__account button {
  border: 0;
  background: transparent;
  font: inherit;
  cursor: pointer;
}

.site-header__message-menu {
  position: relative;
  width: 3rem;
  height: 3rem;
  flex: 0 0 3rem;
}

.site-header__message-trigger {
  position: relative;
  display: flex;
  width: 3rem;
  height: 3rem;
  align-items: center;
  justify-content: center;
}

.site-header__message-trigger:hover {
  text-decoration: none !important;
}

.site-header__message-bell {
  display: flex;
  width: 1.5rem;
  height: 1.5rem;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #6b7178;
}

.site-header__message-bell svg {
  width: 1rem;
  height: 1rem;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.site-header__message-total {
  position: absolute;
  top: 0.35rem;
  left: 1.65rem;
  box-shadow: 0 0 0 2px var(--cc98-color-topbar);
}

.site-header__message-dropdown {
  position: absolute;
  top: 3rem;
  right: 0;
  z-index: 100;
  width: 9rem;
  max-height: 0;
  overflow: hidden;
  background: var(--cc98-color-primary);
  font-size: 0.875rem;
  opacity: 0;
  pointer-events: none;
  visibility: hidden;
  transition:
    max-height 0.2s ease,
    opacity 0.15s ease,
    visibility 0s linear 0.2s;
}

.site-header--home .site-header__message-dropdown {
  background: var(--cc98-color-topbar);
}

.site-header__message-menu:hover .site-header__message-dropdown,
.site-header__message-menu:focus-within .site-header__message-dropdown {
  max-height: 8rem;
  opacity: 1;
  pointer-events: auto;
  visibility: visible;
  transition-delay: 0s;
}

.site-header__message-dropdown > a {
  display: grid;
  width: 100%;
  height: 2rem;
  align-items: center;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.5rem;
  padding-inline: 0.75rem;
  color: #fff;
  white-space: nowrap;
}

.site-header__message-dropdown > a:hover,
.site-header__message-dropdown > a:focus-visible {
  background: var(--cc98-color-accent);
  color: #fff;
  text-decoration: none;
  outline: none;
}

.site-header__message-count {
  justify-self: end;
}

.site-header__message-dropdown > a:hover .site-header__message-count,
.site-header__message-dropdown > a:focus-visible .site-header__message-count {
  background: #fff;
  color: var(--cc98-color-accent);
}

.site-header__user {
  gap: 0.4rem;
}

.site-header__user img {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  object-fit: cover;
}

.site-header__user-menu {
  position: relative;
  height: 3rem;
}

.site-header__user {
  height: 3rem;
}

.site-header__user-dropdown {
  position: absolute;
  top: 3rem;
  right: 0;
  z-index: 100;
  width: 6rem;
  max-height: 0;
  overflow: hidden;
  background: var(--cc98-color-primary);
  font-size: 0.875rem;
  opacity: 0;
  pointer-events: none;
  visibility: hidden;
  transition:
    max-height 0.2s ease,
    opacity 0.15s ease,
    visibility 0s linear 0.2s;
}

.site-header--home .site-header__user-dropdown {
  background: var(--cc98-color-topbar);
}

.site-header__user-menu:hover .site-header__user-dropdown,
.site-header__user-menu:focus-within .site-header__user-dropdown {
  max-height: 8rem;
  opacity: 1;
  pointer-events: auto;
  visibility: visible;
  transition-delay: 0s;
}

.site-header__user-dropdown > a,
.site-header__user-dropdown > button {
  display: flex;
  width: 100%;
  height: 2rem;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: #fff;
  font: inherit;
  cursor: pointer;
}

.site-header__user-dropdown > a:hover,
.site-header__user-dropdown > a:focus-visible,
.site-header__user-dropdown > button:hover,
.site-header__user-dropdown > button:focus-visible {
  background: #fb6165;
  color: #fff;
  text-decoration: none;
  outline: none;
}

@media (min-width: 71.25rem) {
  .site-header__topbar > .cc98-content {
    max-width: 100%;
  }
}

@media (max-width: 1180px) {
  .header-search {
    width: 22rem;
  }
}

@media (max-width: 1000px) {
  .site-header__nav,
  .header-search,
  .site-header__separator {
    display: none;
  }
}
</style>
