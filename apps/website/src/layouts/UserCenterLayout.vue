<script setup lang="ts">
import { useTitle, useWindowScroll } from "@vueuse/core";
import { RouterLink, RouterView } from "vue-router";

useTitle("个人中心 - CC98 论坛");

const { y } = useWindowScroll({ behavior: "smooth" });

const links = [
  ["/usercenter", "个人主页", "M12 3h8v12h6V14h4v9h6V11z"],
  [
    "/usercenter/settings",
    "修改资料",
    "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8m0-5v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4",
  ],
  [
    "/usercenter/topics",
    "我的主题",
    "M4 19.5V22h2.5L19.8 8.7l-2.5-2.5zm15.7-15.3-2.5-2.5-2.1 2.1 2.5 2.5z",
  ],
  [
    "/usercenter/posts",
    "我的回复",
    "M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z",
  ],
  ["/usercenter/history", "我的足迹", "M12 7v5l3 2M3.1 12a9 9 0 1 0 2.6-6.4L3 8.3M3 3v5h5"],
  [
    "/usercenter/favorites",
    "我的收藏",
    "m12 3 2.8 5.7 6.3.9-4.6 4.4 1.1 6.3-5.6-3-5.6 3 1.1-6.3-4.6-4.4 6.3-.9z",
  ],
  ["/usercenter/boards", "关注版面", "M4 5h16v14H4zm3 3h4v4H7zm6 0h4m-4 4h4M7 15h10"],
  [
    "/usercenter/following",
    "关注用户",
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8m10 0v6m3-3h-6",
  ],
  [
    "/usercenter/followers",
    "我的粉丝",
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8m7-7a4 4 0 0 1 0 7.7",
  ],
] as const;
</script>

<template>
  <section class="user-center-page">
    <h1 class="user-center-page__title">个人中心</h1>

    <div class="user-center-shell">
      <nav class="user-center-nav" aria-label="个人中心">
        <ul>
          <li v-for="[to, label, icon] in links" :key="to">
            <RouterLink
              :to="to"
              :active-class="to === '/usercenter' ? '' : 'is-active'"
              :exact-active-class="to === '/usercenter' ? 'is-active' : ''"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path :d="icon" />
              </svg>
              <span>{{ label }}</span>
            </RouterLink>
          </li>
        </ul>
      </nav>

      <main class="user-center-main">
        <RouterView />
      </main>
    </div>

    <button v-if="y > 234" type="button" class="new-topics-to-top" @click="y = 0">回到顶部</button>
  </section>
</template>
