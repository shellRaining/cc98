<script setup lang="ts">
import { computed } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { RouterLink, RouterView } from "vue-router";
import { useReadAllNotificationKindsMutation } from "../api/mutations";
import { unreadCountsQuery } from "../api/queries";
import { useUserStore } from "../stores/user";

const user = useUserStore();
const authScope = computed(() => user.user?.id ?? "anonymous");
const { data: counts } = useQuery(
  computed(() => unreadCountsQuery(authScope.value, user.isLoggedIn)),
);
const readAll = useReadAllNotificationKindsMutation();
const notificationUnread = computed(
  () =>
    (counts.value?.replyCount ?? 0) +
    (counts.value?.atCount ?? 0) +
    (counts.value?.systemCount ?? 0),
);

const links = computed(
  () =>
    [
      ["/messages/replies", "回复我的", counts.value?.replyCount ?? 0],
      ["/messages/mentions", "@ 我的", counts.value?.atCount ?? 0],
      ["/messages/system", "系统通知", counts.value?.systemCount ?? 0],
      ["/messages/private", "我的私信", counts.value?.messageCount ?? 0],
      ["/messages/settings", "消息设置", 0],
    ] as const,
);

function markAllRead() {
  readAll.mutate({ authScope: authScope.value });
}
</script>

<template>
  <section class="messages-page">
    <header class="messages-page__header">
      <h1>我的消息</h1>
      <button
        type="button"
        :disabled="notificationUnread === 0 || readAll.isPending.value"
        @click="markAllRead"
      >
        {{ readAll.isPending.value ? "处理中" : "全部标为已读" }}
      </button>
    </header>
    <p v-if="readAll.error.value" class="messages-page__error">标记失败，请稍后重试</p>
    <div class="messages-shell">
      <nav class="messages-nav" aria-label="消息分类">
        <RouterLink v-for="[to, label, count] in links" :key="to" :to="to" active-class="is-active">
          <span>{{ label }}</span>
          <span v-if="count > 0" class="messages-nav__count">{{ count }}</span>
        </RouterLink>
      </nav>
      <main class="messages-main">
        <RouterView />
      </main>
    </div>
  </section>
</template>

<style scoped>
.messages-page {
  position: relative;
  width: 100%;
  max-width: 71.25rem;
  margin: 0 auto;
}

.messages-page__header {
  display: flex;
  height: 2rem;
  align-items: center;
}

.messages-page__header h1 {
  margin: 0;
  color: var(--cc98-color-text-muted);
  font-size: 1rem;
  font-weight: 400;
}

.messages-page__header button {
  width: 6.25rem;
  height: 1.875rem;
  margin-left: 8.25rem;
  border: 0;
  border-radius: 3px;
  background: var(--cc98-color-primary-fill);
  color: #fff;
  font: inherit;
  font-size: 0.75rem;
  cursor: pointer;
}

.messages-page__header button:disabled {
  cursor: default;
  opacity: 0.55;
}

.messages-page__error {
  position: absolute;
  top: 0.35rem;
  left: 25rem;
  margin: 0;
  color: var(--cc98-color-accent);
  font-size: 0.75rem;
}

.messages-shell {
  display: flex;
  margin-top: 1.25rem;
}

.messages-nav {
  display: flex;
  width: 12.375rem;
  height: 25rem;
  flex: 0 0 12.375rem;
  flex-direction: column;
  border: 1px solid var(--cc98-color-border);
  margin-right: 1.875rem;
  background: var(--cc98-color-surface);
}

.messages-nav > a {
  position: relative;
  display: flex;
  width: 11.125rem;
  height: 3.5rem;
  flex: 0 0 3.5rem;
  align-items: center;
  margin-left: 0.5625rem;
  padding-left: 1.3125rem;
  border-bottom: 1px dashed var(--cc98-color-border);
  color: var(--cc98-color-text);
  font-size: 0.875rem;
}

.messages-nav > a:hover,
.messages-nav > a.is-active {
  color: var(--cc98-color-accent);
  text-decoration: none;
}

.messages-nav__count {
  position: absolute;
  top: 0.65rem;
  left: 6.85rem;
  display: flex;
  min-width: 1.25rem;
  height: 0.875rem;
  align-items: center;
  justify-content: center;
  padding: 0 0.25rem;
  border-radius: 0.5rem;
  background: #fb6165;
  color: #fff;
  font-size: 0.625rem;
  line-height: 1;
}

.messages-main {
  min-width: 0;
  flex: 1 1 auto;
}
</style>
