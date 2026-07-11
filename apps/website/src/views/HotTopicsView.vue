<script setup lang="ts">
import { computed } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { useRoute, useRouter } from "vue-router";
import { hotTopicsQuery } from "../api/queries";
import PageState from "../components/PageState.vue";
import TopicList from "../components/TopicList.vue";
import { normalizeApiError } from "../lib/api-error";
import { HOT_PERIOD_LABELS, hotTopicsPath, isHotPeriod, type HotPeriod } from "../lib/discovery";
import { saveLoginRedirect } from "../lib/login-redirect";

const route = useRoute();
const router = useRouter();

const period = computed<HotPeriod>(() => {
  const meta = route.meta.hotPeriod;
  return isHotPeriod(meta) ? meta : "monthly";
});

const title = computed(() => HOT_PERIOD_LABELS[period.value]);

const options = computed(() => hotTopicsQuery(period.value));
const { data: topics, error, isPending, refetch } = useQuery(options);

const pageError = computed(() => (error.value ? normalizeApiError(error.value) : null));

const stateKind = computed(() => {
  if (isPending.value) return "loading" as const;
  if (pageError.value?.kind === "unauthorized") return "unauthorized" as const;
  if (pageError.value?.kind === "forbidden") return "forbidden" as const;
  if (pageError.value?.kind === "not-found") return "not-found" as const;
  if (pageError.value) return "error" as const;
  if ((topics.value?.length ?? 0) === 0) return "empty" as const;
  return null;
});

function goLogin() {
  saveLoginRedirect(route.fullPath);
  void router.push({ name: "logon" });
}
</script>

<template>
  <section class="space-y-4">
    <header class="space-y-3">
      <h1 class="text-2xl font-bold">{{ title }}</h1>
      <nav class="flex flex-wrap gap-3 text-sm">
        <RouterLink
          :to="hotTopicsPath('weekly')"
          class="cc98-link"
          :class="{ 'font-semibold text-cc98-primary': period === 'weekly' }"
        >
          本周
        </RouterLink>
        <RouterLink
          :to="hotTopicsPath('monthly')"
          class="cc98-link"
          :class="{ 'font-semibold text-cc98-primary': period === 'monthly' }"
        >
          本月
        </RouterLink>
        <RouterLink
          :to="hotTopicsPath('history')"
          class="cc98-link"
          :class="{ 'font-semibold text-cc98-primary': period === 'history' }"
        >
          历史上的今天
        </RouterLink>
      </nav>
    </header>

    <PageState
      v-if="stateKind"
      :kind="stateKind"
      :message="pageError?.message"
      :show-retry="stateKind === 'error'"
      @login="goLogin"
      @retry="refetch()"
    />

    <div v-else class="cc98-card px-4">
      <TopicList :topics="topics ?? []" />
    </div>
  </section>
</template>
