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
} from "../lib/discovery";
import { saveLoginRedirect } from "../lib/login-redirect";
import { totalUnreadCount } from "../lib/messages";
import { isSiteAdministrator } from "../lib/site-manage";
import { useUserStore } from "../stores/user";

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
const unreadTotal = computed(() => totalUnreadCount(unreadCounts.value));
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
                <span v-if="unreadTotal > 0" class="site-header__message-total">
                  {{ unreadTotal }}
                </span>
              </RouterLink>
              <nav class="site-header__message-dropdown" aria-label="消息分类">
                <RouterLink to="/messages/replies">
                  <span>回复我的</span>
                  <span v-if="unreadCounts?.replyCount" class="site-header__message-count">
                    {{ unreadCounts.replyCount }}
                  </span>
                </RouterLink>
                <RouterLink to="/messages/mentions">
                  <span>@ 我的</span>
                  <span v-if="unreadCounts?.atCount" class="site-header__message-count">
                    {{ unreadCounts.atCount }}
                  </span>
                </RouterLink>
                <RouterLink to="/messages/system">
                  <span>系统通知</span>
                  <span v-if="unreadCounts?.systemCount" class="site-header__message-count">
                    {{ unreadCounts.systemCount }}
                  </span>
                </RouterLink>
                <RouterLink to="/messages/private">
                  <span>我的私信</span>
                  <span v-if="unreadCounts?.messageCount" class="site-header__message-count">
                    {{ unreadCounts.messageCount }}
                  </span>
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
