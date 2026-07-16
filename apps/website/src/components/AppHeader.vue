<script setup lang="ts">
import { computed, ref } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { unreadCountsQuery } from "../api/queries";
import { searchBoardsPath, searchTopicsPath, userNamePath } from "../lib/discovery";
import { saveLoginRedirect } from "../lib/login-redirect";
import { totalUnreadCount } from "../lib/messages";
import { useUserStore } from "../stores/user";
import UiBadge from "./ui/Badge.vue";

type SearchKind = "topic" | "user" | "board";

const user = useUserStore();
const route = useRoute();
const router = useRouter();
const keyword = ref("");
const searchKind = ref<SearchKind>("topic");
const isHome = computed(() => route.name === "home");
const authScope = computed(() => user.user?.id ?? "anonymous");
const { data: unreadCounts } = useQuery(
  computed(() => unreadCountsQuery(authScope.value, user.isLoggedIn)),
);
const unreadTotal = computed(() => totalUnreadCount(unreadCounts.value));

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
  else void router.push(searchTopicsPath(value));
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
            <RouterLink to="/usercenter/boards">关注</RouterLink>
            <RouterLink to="/recommendedtopics">精选</RouterLink>
          </nav>
          <form class="header-search" role="search" @submit.prevent="submitSearch">
            <label class="sr-only" for="header-search-kind">搜索类型</label>
            <select id="header-search-kind" v-model="searchKind">
              <option value="topic">主题</option>
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
            <RouterLink to="/messages" class="site-header__message">
              消息
              <UiBadge v-if="unreadTotal > 0" :count="unreadTotal" />
            </RouterLink>
            <RouterLink to="/signin">签到</RouterLink>
            <RouterLink to="/usercenter" class="site-header__user">
              <img v-if="user.user?.avatarUrl" :src="user.user.avatarUrl" alt="" />
              <span>{{ user.user?.name }}</span>
            </RouterLink>
            <button type="button" @click="user.logout()">退出</button>
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
