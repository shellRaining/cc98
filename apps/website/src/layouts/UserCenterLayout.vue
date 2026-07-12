<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
import { useUserStore } from "../stores/user";

const user = useUserStore();

const links = [
  ["/usercenter", "概览"],
  ["/usercenter/topics", "我的主题"],
  ["/usercenter/posts", "我的回复"],
  ["/usercenter/favorites", "我的收藏"],
  ["/usercenter/history", "浏览历史"],
  ["/usercenter/following", "关注用户"],
  ["/usercenter/followers", "我的粉丝"],
  ["/usercenter/boards", "关注版面"],
] as const;
</script>

<template>
  <section class="grid gap-6 md:grid-cols-[13rem_minmax(0,1fr)]">
    <aside class="space-y-4">
      <div class="cc98-card p-4">
        <p class="text-xs text-cc98-text-muted">当前账号</p>
        <p class="mt-1 font-semibold">{{ user.user?.name }}</p>
      </div>
      <nav class="cc98-card p-2 flex gap-2 overflow-x-auto md:flex-col" aria-label="用户中心">
        <RouterLink
          v-for="[to, label] in links"
          :key="to"
          :to="to"
          class="rounded px-3 py-2 text-sm whitespace-nowrap text-cc98-text-muted hover:bg-cc98-bg hover:text-cc98-primary"
          active-class="bg-cc98-bg text-cc98-primary font-medium"
          :exact-active-class="
            to === '/usercenter' ? 'bg-cc98-bg text-cc98-primary font-medium' : ''
          "
        >
          {{ label }}
        </RouterLink>
      </nav>
    </aside>
    <div class="min-w-0">
      <RouterView />
    </div>
  </section>
</template>
