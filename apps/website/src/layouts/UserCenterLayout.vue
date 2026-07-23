<script setup lang="ts">
import { useTitle, useWindowScroll } from "@vueuse/core";
import { RouterLink, RouterView, useRoute, useRouter } from "vue-router";
import FullPageStatus from "../components/FullPageStatus.vue";
import { saveLoginRedirect } from "../lib/login-redirect";
import { useUserStore } from "../stores/user";

useTitle("个人中心 - CC98 论坛");

const route = useRoute();
const router = useRouter();
const user = useUserStore();
const { y } = useWindowScroll({ behavior: "smooth" });

function goLogin() {
  saveLoginRedirect(route.fullPath);
  void router.push({ name: "logon" });
}

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
  ["/usercenter/transfer", "转账系统", "M3 6h18v12H3zM3 10h18M7 15h4"],
  [
    "/usercenter/theme",
    "切换皮肤",
    "M12 3a9 9 0 1 0 0 18h1.5a1.5 1.5 0 0 0 0-3H12a2 2 0 0 1 0-4h2a4 4 0 0 0 0-8zm-4 7.5h.01M10.5 7h.01M15 7.5h.01M17 11h.01",
  ],
] as const;
</script>

<template>
  <FullPageStatus v-if="!user.isLoggedIn" kind="unauthorized" @login="goLogin" />
  <section v-else class="user-center-page">
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

<style scoped>
.new-topics-to-top {
  position: fixed;
  right: 5%;
  bottom: 5%;
  z-index: 2;
  width: 6rem;
  height: 2rem;
  border: 0;
  border-radius: 999px;
  background: var(--cc98-color-primary-fill);
  color: #fff;
  font: inherit;
  cursor: pointer;
  opacity: 0.55;
}

.new-topics-to-top:hover {
  opacity: 0.85;
}

.user-center-page {
  position: relative;
  width: 100%;
  min-height: 46.875rem;
  margin-top: -1.5rem;
  margin-bottom: 3rem;
  font-size: 0.88rem;
}

.user-center-page__title {
  margin: 0 0 1.25rem;
  color: var(--cc98-color-text);
  font-size: 1rem;
  font-weight: 400;
}

.user-center-shell {
  display: grid;
  grid-template-columns: 12.625rem minmax(0, 1fr);
  gap: 1.75rem;
  align-items: start;
}

.user-center-nav,
.user-center-main {
  border: 1px solid var(--cc98-color-border);
  background: var(--cc98-color-surface);
}

.user-center-nav {
  min-height: 40rem;
  padding: 0 0.625rem;
}

.user-center-nav ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.user-center-nav li + li {
  border-top: 1px dashed var(--cc98-color-border);
}

.user-center-nav a,
.user-center-nav a:visited {
  display: flex;
  height: 3.5rem;
  align-items: center;
  gap: 0.4rem;
  padding: 0 0.65rem;
  color: var(--cc98-color-text);
  text-decoration: none;
}

.user-center-nav a:hover,
.user-center-nav a.router-link-active,
.user-center-nav a.is-active {
  color: var(--cc98-color-primary);
}

.user-center-nav svg {
  width: 1.15rem;
  height: 1.15rem;
  flex: 0 0 auto;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.7;
}

.user-center-main {
  min-height: 40rem;
  padding: 2rem;
}

@media (max-width: 1000px) {
  .user-center-shell {
    grid-template-columns: 10rem minmax(0, 1fr);
    gap: 1rem;
  }

  .user-center-main {
    padding: 1.5rem;
  }
}
</style>
