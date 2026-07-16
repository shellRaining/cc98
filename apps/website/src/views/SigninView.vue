<script setup lang="ts">
import { computed } from "vue";
import { useQuery } from "@tanstack/vue-query";
import dayjs from "dayjs";
import { useRoute, useRouter } from "vue-router";
import { useSigninMutation } from "../api/mutations";
import {
  currentUserQuery,
  serverNowQuery,
  signinInfoQuery,
  signinMonthQuery,
} from "../api/queries";
import PageState from "../components/PageState.vue";
import UiButton from "../components/ui/Button.vue";
import { normalizeApiError } from "../lib/api-error";
import { useUserStore } from "../stores/user";

const route = useRoute();
const router = useRouter();
const user = useUserStore();
const authScope = computed(() => user.user?.id ?? "anonymous");
const nowQuery = useQuery(serverNowQuery);
const serverDate = computed(() => dayjs(nowQuery.data.value));
const year = computed(() => {
  const value = Number(route.query.year);
  return Number.isInteger(value) && value >= 2016 ? value : serverDate.value.year();
});
const month = computed(() => {
  const value = Number(route.query.month);
  return Number.isInteger(value) && value >= 1 && value <= 12
    ? value
    : serverDate.value.month() + 1;
});
const infoQuery = useQuery(computed(() => signinInfoQuery(authScope.value, user.isLoggedIn)));
const recordsQuery = useQuery(
  computed(() => signinMonthQuery(year.value, month.value, authScope.value, user.isLoggedIn)),
);
const meQuery = useQuery({ ...currentUserQuery, enabled: computed(() => user.isLoggedIn) });
const signin = useSigninMutation();

const recordMap = computed(
  () => new Map((recordsQuery.data.value ?? []).map((record) => [record.day, record])),
);
const days = computed(() => {
  const first = dayjs(`${year.value}-${String(month.value).padStart(2, "0")}-01`);
  const leading = first.day();
  return [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: first.daysInMonth() }, (_, index) => index + 1),
  ];
});

function changeMonth(offset: number) {
  const next = dayjs(`${year.value}-${String(month.value).padStart(2, "0")}-01`).add(
    offset,
    "month",
  );
  void router.push({ path: "/signin", query: { year: next.year(), month: next.month() + 1 } });
}

function signInToday() {
  signin.mutate("");
}
</script>

<template>
  <section class="mx-auto max-w-3xl space-y-6">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold">每日签到</h1>
        <p class="text-sm text-cc98-text-muted">连续签到可以获得论坛财富奖励。</p>
      </div>
      <RouterLink to="/messages" class="cc98-link text-sm">返回消息中心</RouterLink>
    </header>

    <PageState v-if="infoQuery.isPending.value" kind="loading" />
    <PageState
      v-else-if="infoQuery.error.value"
      kind="error"
      :message="normalizeApiError(infoQuery.error.value).message"
      @retry="infoQuery.refetch()"
    />
    <template v-else-if="infoQuery.data.value">
      <div class="grid gap-3 sm:grid-cols-4">
        <div class="cc98-card p-4">
          <p class="text-xs text-cc98-text-muted">今日状态</p>
          <p class="mt-1 font-semibold">
            {{ infoQuery.data.value.hasSignedInToday ? "已签到" : "未签到" }}
          </p>
        </div>
        <div class="cc98-card p-4">
          <p class="text-xs text-cc98-text-muted">连续签到</p>
          <p class="mt-1 font-semibold">{{ infoQuery.data.value.lastSignInCount }} 天</p>
        </div>
        <div class="cc98-card p-4">
          <p class="text-xs text-cc98-text-muted">上次奖励</p>
          <p class="mt-1 font-semibold">{{ infoQuery.data.value.lastReward }}</p>
        </div>
        <div class="cc98-card p-4">
          <p class="text-xs text-cc98-text-muted">补签卡</p>
          <p class="mt-1 font-semibold">{{ meQuery.data.value?.signInCardCount ?? 0 }} 张</p>
        </div>
      </div>

      <div class="cc98-card p-4 flex flex-wrap items-center justify-between gap-3">
        <p class="text-sm text-cc98-text-muted">
          {{ infoQuery.data.value.hasSignedInToday ? "今天已经签到。" : "今天还没有签到。" }}
        </p>
        <UiButton
          type="button"
          size="sm"
          :disabled="infoQuery.data.value.hasSignedInToday"
          :loading="signin.isPending.value"
          @click="signInToday"
        >
          {{ signin.isPending.value ? "签到中…" : "立即签到" }}
        </UiButton>
        <p v-if="signin.error.value" class="w-full text-sm text-cc98-accent">
          {{ normalizeApiError(signin.error.value).message }}
        </p>
      </div>

      <section class="cc98-card p-4 space-y-4">
        <header class="flex items-center justify-between gap-3">
          <button type="button" class="cc98-link" @click="changeMonth(-1)">上个月</button>
          <h2 class="text-lg font-semibold">{{ year }} 年 {{ month }} 月</h2>
          <button type="button" class="cc98-link" @click="changeMonth(1)">下个月</button>
        </header>
        <PageState v-if="recordsQuery.isPending.value" kind="loading" class="min-h-96" />
        <PageState
          v-else-if="recordsQuery.error.value"
          kind="error"
          class="min-h-96"
          :message="normalizeApiError(recordsQuery.error.value).message"
          @retry="recordsQuery.refetch()"
        />
        <template v-else>
          <div class="grid grid-cols-7 text-center text-xs text-cc98-text-muted">
            <span v-for="label in ['日', '一', '二', '三', '四', '五', '六']" :key="label"
              >周{{ label }}</span
            >
          </div>
          <div class="grid min-h-96 grid-cols-7 gap-2">
            <div v-for="(day, index) in days" :key="`${day}-${index}`" class="min-h-16">
              <div
                v-if="day"
                class="h-full rounded border border-cc98-border p-2 text-sm"
                :class="recordMap.has(day) ? 'bg-cc98-surface-subtle' : ''"
              >
                <div class="flex items-center justify-between gap-1">
                  <span>{{ day }}</span>
                  <span v-if="recordMap.get(day)?.useCard" class="text-xs text-cc98-accent"
                    >补</span
                  >
                </div>
                <p v-if="recordMap.has(day)" class="mt-2 text-xs text-cc98-primary">
                  +{{ recordMap.get(day)?.reward }}
                </p>
              </div>
            </div>
          </div>
        </template>
      </section>
    </template>
  </section>
</template>
