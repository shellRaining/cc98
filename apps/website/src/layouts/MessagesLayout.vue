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
