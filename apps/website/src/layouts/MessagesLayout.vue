<script setup lang="ts">
import { computed } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { RouterLink, RouterView } from "vue-router";
import { unreadCountsQuery } from "../api/queries";
import { useUserStore } from "../stores/user";

const user = useUserStore();
const authScope = computed(() => user.user?.id ?? "anonymous");
const { data: counts } = useQuery(
  computed(() => unreadCountsQuery(authScope.value, user.isLoggedIn)),
);

const links = computed(
  () =>
    [
      ["/messages/replies", "回复我的", counts.value?.replyCount ?? 0],
      ["/messages/mentions", "@ 我的", counts.value?.atCount ?? 0],
      ["/messages/system", "系统通知", counts.value?.systemCount ?? 0],
      ["/messages/private", "私信", counts.value?.messageCount ?? 0],
    ] as const,
);
</script>

<template>
  <section class="grid gap-6 md:grid-cols-[13rem_minmax(0,1fr)]">
    <aside class="space-y-4">
      <div class="cc98-card p-4">
        <p class="text-xs text-cc98-text-muted">消息中心</p>
        <p class="mt-1 font-semibold">{{ user.user?.name }}</p>
      </div>
      <nav class="cc98-card p-2 flex gap-2 overflow-x-auto md:flex-col" aria-label="消息分类">
        <RouterLink
          v-for="[to, label, count] in links"
          :key="to"
          :to="to"
          class="rounded px-3 py-2 text-sm whitespace-nowrap text-cc98-text-muted hover:bg-cc98-surface-subtle hover:text-cc98-primary flex items-center justify-between gap-3"
          active-class="bg-cc98-surface-subtle text-cc98-primary font-medium"
        >
          <span>{{ label }}</span>
          <span
            v-if="count > 0"
            class="min-w-5 rounded-full bg-cc98-accent px-1.5 text-center text-xs text-cc98-on-primary"
          >
            {{ count > 99 ? "99+" : count }}
          </span>
        </RouterLink>
      </nav>
      <RouterLink to="/signin" class="cc98-link text-sm px-3">每日签到</RouterLink>
    </aside>
    <div class="min-w-0">
      <RouterView />
    </div>
  </section>
</template>
