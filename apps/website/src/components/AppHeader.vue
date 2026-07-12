<script setup lang="ts">
import { computed } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { RouterLink, useRouter } from "vue-router";
import { unreadCountsQuery } from "../api/queries";
import { totalUnreadCount } from "../lib/messages";
import { useUserStore } from "../stores/user";
import { useThemeStore } from "../stores/theme";
import { saveLoginRedirect } from "../lib/login-redirect";

const user = useUserStore();
const theme = useThemeStore();
const router = useRouter();
const authScope = computed(() => user.user?.id ?? "anonymous");
const { data: unreadCounts } = useQuery(
  computed(() => unreadCountsQuery(authScope.value, user.isLoggedIn)),
);
const unreadTotal = computed(() => totalUnreadCount(unreadCounts.value));

function goLogin(event?: Event) {
  event?.preventDefault();
  saveLoginRedirect(router.currentRoute.value.fullPath);
  void router.push({ name: "logon" });
}
</script>

<template>
  <header class="border-b border-cc98-border bg-cc98-bg-elevated">
    <div class="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
      <div class="flex items-center gap-6">
        <RouterLink to="/" class="text-lg font-bold text-cc98-text hover:text-cc98-primary">
          CC98
        </RouterLink>
        <nav class="flex items-center gap-4 text-sm">
          <RouterLink to="/" class="cc98-link">首页</RouterLink>
          <RouterLink to="/boardlist" class="cc98-link">版面</RouterLink>
          <RouterLink to="/topic/hot-monthly" class="cc98-link">热门</RouterLink>
          <RouterLink to="/newtopics" class="cc98-link">新帖</RouterLink>
          <RouterLink to="/recommendedtopics" class="cc98-link">精选</RouterLink>
          <RouterLink to="/search" class="cc98-link">搜索</RouterLink>
        </nav>
      </div>
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="border-0 bg-transparent p-0 text-sm text-cc98-text-muted hover:text-cc98-text"
          @click="theme.toggleMode()"
        >
          {{ theme.mode === "light" ? "深色" : "浅色" }}
        </button>
        <template v-if="user.isLoggedIn">
          <RouterLink to="/messages" class="relative text-sm cc98-link">
            消息
            <span
              v-if="unreadTotal > 0"
              class="absolute -right-3 -top-2 min-w-5 rounded-full bg-cc98-accent px-1 text-center text-xs leading-5 text-white"
            >
              {{ unreadTotal > 99 ? "99+" : unreadTotal }}
            </span>
          </RouterLink>
          <RouterLink to="/signin" class="text-sm cc98-link">签到</RouterLink>
          <RouterLink v-if="user.user?.id" to="/usercenter" class="text-sm cc98-link">
            {{ user.user?.name }}
          </RouterLink>
          <span v-else class="text-sm text-cc98-text-muted">{{ user.user?.name }}</span>
          <button
            type="button"
            class="cc98-link border-0 bg-transparent p-0 text-sm"
            @click="user.logout()"
          >
            退出
          </button>
        </template>
        <RouterLink v-else to="/logon" class="cc98-link text-sm" @click="goLogin">登录</RouterLink>
      </div>
    </div>
  </header>
</template>
