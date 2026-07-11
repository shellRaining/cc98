<script setup lang="ts">
import { computed, ref } from "vue";
import { useQuery } from "@tanstack/vue-query";
import type { RecommendedTopic } from "@cc98/api";
import { useRoute, useRouter } from "vue-router";
import { recommendedTopicsQuery } from "../api/queries";
import PageState from "../components/PageState.vue";
import TopicListItem from "../components/TopicListItem.vue";
import { normalizeApiError } from "../lib/api-error";
import { saveLoginRedirect } from "../lib/login-redirect";
import { useUserStore } from "../stores/user";

const PAGE_SIZE = 10;
const route = useRoute();
const router = useRouter();
const user = useUserStore();

const refreshToken = ref(0);
const authScope = computed(() => user.user?.id ?? "anonymous");
const canLoad = computed(() => user.isLoggedIn);

const options = computed(() =>
  recommendedTopicsQuery(authScope.value, refreshToken.value, PAGE_SIZE, canLoad.value),
);

const { data, error, isPending, isFetching, refetch } = useQuery(options);

const items = computed(() =>
  (data.value ?? []).filter(
    (item): item is RecommendedTopic & { topic: NonNullable<RecommendedTopic["topic"]> } =>
      item.topic != null,
  ),
);

const pageError = computed(() => {
  if (!user.isLoggedIn) return normalizeApiError({ status: 401 });
  if (error.value) return normalizeApiError(error.value);
  return null;
});

const stateKind = computed(() => {
  if (pageError.value?.kind === "unauthorized") return "unauthorized" as const;
  if (isPending.value) return "loading" as const;
  if (pageError.value?.kind === "forbidden") return "forbidden" as const;
  if (pageError.value?.kind === "not-found") return "not-found" as const;
  if (pageError.value) return "error" as const;
  if (items.value.length === 0) return "empty" as const;
  return null;
});

function goLogin() {
  saveLoginRedirect(route.fullPath);
  void router.push({ name: "logon" });
}

function refreshBatch() {
  refreshToken.value += 1;
}
</script>

<template>
  <section class="space-y-4">
    <header class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold">随机精选</h1>
        <p class="mt-1 text-sm text-cc98-text-muted">每次随机一批推荐主题。</p>
      </div>
      <button
        type="button"
        class="cc98-link text-sm disabled:opacity-50"
        :disabled="!canLoad || isFetching"
        @click="refreshBatch"
      >
        {{ isFetching ? "加载中…" : "换一批" }}
      </button>
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
      <ul>
        <TopicListItem v-for="item in items" :key="item.topic.id" :topic="item.topic">
          <p
            v-if="item.content?.trim()"
            class="mt-2 text-sm text-cc98-text-muted whitespace-pre-wrap"
          >
            {{ item.content.trim() }}
          </p>
        </TopicListItem>
      </ul>
    </div>
  </section>
</template>
