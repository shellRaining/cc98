<script setup lang="ts">
import type { SigninRecord } from "@cc98/api";
import { useQuery } from "@tanstack/vue-query";
import dayjs, { type Dayjs } from "dayjs";
import { useTitle } from "@vueuse/core";
import { computed, ref, watchEffect } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useMakeUpSigninMutation, useSigninMutation } from "../api/mutations";
import {
  currentUserQuery,
  serverNowQuery,
  signinInfoQuery,
  signinMonthQuery,
} from "../api/queries";
import PageState from "../components/PageState.vue";
import { normalizeApiError } from "../lib/api-error";
import { useUserStore } from "../stores/user";

type CalendarStatus = "signed" | "makeup" | "missed" | "future";
type CalendarCell = {
  day: number;
  date: Dayjs;
  record?: SigninRecord;
  status: CalendarStatus;
} | null;

const MIN_MONTH = dayjs("2016-06-01");
const WEEKDAYS = ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"];

const route = useRoute();
const router = useRouter();
const user = useUserStore();
const content = ref("");
const signinFeedback = ref("");
const makeupFeedback = ref("");

useTitle("论坛签到 - CC98 论坛");

const authScope = computed(() => user.user?.id ?? "anonymous");
const nowQuery = useQuery(serverNowQuery);
const serverDate = computed(() => {
  const value = dayjs(nowQuery.data.value);
  return value.isValid() ? value : dayjs();
});
const currentMonth = computed(() => serverDate.value.startOf("month"));
const selectedMonth = computed(() => {
  const year = Number(route.query.year);
  const month = Number(route.query.month);
  const requested =
    Number.isInteger(year) && Number.isInteger(month) && month >= 1 && month <= 12
      ? dayjs(String(year) + "-" + String(month).padStart(2, "0") + "-01")
      : currentMonth.value;

  if (requested.isBefore(MIN_MONTH, "month")) return MIN_MONTH;
  if (requested.isAfter(currentMonth.value, "month")) return currentMonth.value;
  return requested;
});
const year = computed(() => selectedMonth.value.year());
const month = computed(() => selectedMonth.value.month() + 1);
const monthInputValue = computed(() => selectedMonth.value.format("YYYY-MM"));
const currentMonthLabel = computed(() => currentMonth.value.format("YYYY年MM月"));
const canGoPrevious = computed(() => selectedMonth.value.isAfter(MIN_MONTH, "month"));
const canGoNext = computed(() => selectedMonth.value.isBefore(currentMonth.value, "month"));

watchEffect(() => {
  if (route.query.year == null && route.query.month == null) return;
  const routeYear = Number(route.query.year);
  const routeMonth = Number(route.query.month);
  if (routeYear === year.value && routeMonth === month.value) return;
  void router.replace({ path: "/signin", query: { year: year.value, month: month.value } });
});

const infoQuery = useQuery(computed(() => signinInfoQuery(authScope.value, user.isLoggedIn)));
const recordsQuery = useQuery(
  computed(() => signinMonthQuery(year.value, month.value, authScope.value, user.isLoggedIn)),
);
const meQuery = useQuery({ ...currentUserQuery, enabled: computed(() => user.isLoggedIn) });
const signin = useSigninMutation();
const makeUpSignin = useMakeUpSigninMutation();

const recordMap = computed(
  () => new Map((recordsQuery.data.value ?? []).map((record) => [record.day, record])),
);
const calendarCells = computed<CalendarCell[]>(() => {
  const first = selectedMonth.value.startOf("month");
  const leading = (first.day() + 6) % 7;
  const cells: CalendarCell[] = Array.from({ length: leading }, () => null);

  for (let day = 1; day <= first.daysInMonth(); day += 1) {
    const date = first.date(day);
    const record = recordMap.value.get(day);
    const status: CalendarStatus = record
      ? record.useCard
        ? "makeup"
        : "signed"
      : date.isAfter(serverDate.value, "day")
        ? "future"
        : "missed";
    cells.push({ day, date, record, status });
  }

  return cells;
});

const lastSigninTime = computed(() => {
  const value = dayjs(infoQuery.data.value?.lastSignInTime);
  return value.isValid() ? value.format("YYYY-MM-DD HH:mm:ss") : "暂无记录";
});
const signinError = computed(() =>
  signin.error.value ? normalizeApiError(signin.error.value).message : "",
);
const makeupError = computed(() =>
  makeUpSignin.error.value ? normalizeApiError(makeUpSignin.error.value).message : "",
);

function setMonth(next: Dayjs) {
  const clamped = next.isBefore(MIN_MONTH, "month")
    ? MIN_MONTH
    : next.isAfter(currentMonth.value, "month")
      ? currentMonth.value
      : next;
  void router.push({
    path: "/signin",
    query: { year: clamped.year(), month: clamped.month() + 1 },
  });
}

function changeMonth(offset: number) {
  setMonth(selectedMonth.value.add(offset, "month"));
}

function selectMonth(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  const next = dayjs(value + "-01");
  if (next.isValid()) setMonth(next);
}

function signInToday() {
  signinFeedback.value = "";
  signin.mutate(content.value, {
    onSuccess: () => {
      content.value = "";
      signinFeedback.value = "签到成功";
    },
  });
}

function makeUpMissedSignin() {
  makeupFeedback.value = "";
  makeUpSignin.mutate(undefined, {
    onSuccess: () => {
      makeupFeedback.value = "补签成功";
    },
  });
}
</script>

<template>
  <section class="signin-page">
    <h1>论坛签到</h1>

    <p class="signin-page__description">
      签到功能是 CC98
      论坛提供的一项娱乐功能。每个用户每天可以签到一次，并获得额外的论坛财富值奖励。如果连续多日签到，则奖励会不断增加。目前财富值的奖励情况如下表所示：
    </p>
    <div class="signin-page__rewards">
      <p>第 1 天：600 到 1200 论坛财富值</p>
      <p>第 2 天：700 到 1400 论坛财富值</p>
      <p>第 3 天：800 到 1600 论坛财富值</p>
      <p>第 4 天：900 到 1800 论坛财富值</p>
      <p>第 5 天及以后：1000 到 2000 论坛财富值</p>
    </div>

    <PageState v-if="infoQuery.isPending.value" kind="loading" class="signin-page__state" />
    <PageState
      v-else-if="infoQuery.error.value"
      kind="error"
      class="signin-page__state"
      :message="normalizeApiError(infoQuery.error.value).message"
      @retry="infoQuery.refetch()"
    />
    <template v-else-if="infoQuery.data.value">
      <div v-if="infoQuery.data.value.hasSignedInToday" class="signin-page__signed">
        <p>你已经连续签到了{{ infoQuery.data.value.lastSignInCount }}天</p>
        <p>上次签到时间是{{ lastSigninTime }}</p>
        <p>获得财富值{{ infoQuery.data.value.lastReward }}</p>
      </div>
      <form v-else class="signin-page__composer" @submit.prevent="signInToday">
        <p>你今天还未签到</p>
        <label for="signin-content">签到留言（可选）</label>
        <textarea
          id="signin-content"
          v-model="content"
          maxlength="20000"
          spellcheck="false"
          :disabled="signin.isPending.value"
        />
        <button type="submit" :disabled="signin.isPending.value">
          {{ signin.isPending.value ? "签到中…" : "签到" }}
        </button>
      </form>
      <p v-if="signinFeedback" class="signin-page__feedback" role="status">
        {{ signinFeedback }}
      </p>
      <p v-else-if="signinError" class="signin-page__feedback signin-page__feedback--error">
        {{ signinError }}
      </p>

      <section class="signin-calendar" aria-labelledby="signin-calendar-title">
        <h2 id="signin-calendar-title" class="sr-only">签到月历</h2>
        <div class="signin-calendar__toolbar">
          <span>补签卡：{{ meQuery.data.value?.signInCardCount ?? 0 }}张</span>
          <details class="signin-calendar__rules">
            <summary aria-label="查看补签规则">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M9.8 9a2.4 2.4 0 0 1 4.6 1c0 1.8-2.4 2-2.4 3.7" />
                <path d="M12 17.3h.01" />
              </svg>
            </summary>
            <div class="signin-calendar__rules-popover">
              <strong>补签规则</strong>
              <p>①补签功能上线后，每位用户获得 3 张补签卡（包括此后新注册用户）</p>
              <p>②使用补签卡后，自动在最近的未签到日补签，并重新计算连续签到天数</p>
              <p>③补签不获得额外的财富值奖励</p>
              <p>④后续会增加补签卡的获取方式</p>
              <p>⑤签到功能使用和显示的时间为北京时间</p>
            </div>
          </details>
          <button
            v-if="(meQuery.data.value?.signInCardCount ?? 0) > 0"
            type="button"
            class="signin-calendar__makeup"
            :disabled="makeUpSignin.isPending.value"
            @click="makeUpMissedSignin"
          >
            {{ makeUpSignin.isPending.value ? "补签中…" : "补签一次" }}
          </button>
        </div>
        <p v-if="makeupFeedback" class="signin-page__feedback" role="status">
          {{ makeupFeedback }}
        </p>
        <p v-else-if="makeupError" class="signin-page__feedback signin-page__feedback--error">
          {{ makeupError }}
        </p>

        <div class="signin-calendar__picker">
          <input
            type="month"
            aria-label="选择签到月份"
            min="2016-06"
            :max="currentMonth.format('YYYY-MM')"
            :value="monthInputValue"
            @change="selectMonth"
          />
          <div class="signin-calendar__month-buttons">
            <button type="button" :disabled="!canGoPrevious" @click="changeMonth(-1)">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
              上月
            </button>
            <button type="button" :disabled="!canGoNext" @click="changeMonth(1)">
              下月
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
            </button>
          </div>
          <span>可追溯范围：2016年06月 - {{ currentMonthLabel }}</span>
        </div>

        <PageState
          v-if="recordsQuery.isPending.value"
          kind="loading"
          class="signin-calendar__state"
        />
        <PageState
          v-else-if="recordsQuery.error.value"
          kind="error"
          class="signin-calendar__state"
          :message="normalizeApiError(recordsQuery.error.value).message"
          @retry="recordsQuery.refetch()"
        />
        <div v-else class="signin-calendar__panel">
          <div class="signin-calendar__weekdays">
            <span v-for="weekday in WEEKDAYS" :key="weekday">{{ weekday }}</span>
          </div>
          <div class="signin-calendar__grid">
            <div
              v-for="(cell, index) in calendarCells"
              :key="cell ? cell.date.format('YYYY-MM-DD') : 'blank-' + index"
              class="signin-calendar__grid-slot"
            >
              <div
                v-if="cell"
                class="signin-calendar__cell"
                :class="'signin-calendar__cell--' + cell.status"
              >
                <span>{{ cell.day }}</span>
                <span v-if="cell.status === 'signed'" class="signin-calendar__tag">
                  +{{ cell.record?.reward }}
                </span>
                <span
                  v-else-if="cell.status === 'makeup'"
                  class="signin-calendar__tag signin-calendar__tag--makeup"
                >
                  补
                </span>
                <span
                  v-else-if="cell.status === 'missed'"
                  class="signin-calendar__tag signin-calendar__tag--missed"
                >
                  未
                </span>
                <span v-else class="signin-calendar__tag">&nbsp;</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </template>
  </section>
</template>

<style scoped>
.signin-page {
  display: flex;
  width: 100%;
  min-height: 60rem;
  flex-direction: column;
  padding: 2rem;
  margin-bottom: 1rem;
  background: var(--cc98-color-surface);
  color: var(--cc98-color-text);
  font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
  font-size: 1rem;
}

.signin-page h1 {
  margin: 0 0 1rem;
  text-align: center;
  font-size: 1rem;
  font-weight: 400;
}

.signin-page__description,
.signin-page__rewards p,
.signin-page__signed p,
.signin-page__composer p,
.signin-calendar__rules-popover p {
  margin: 0;
}

.signin-page__rewards {
  margin: 0.5rem 0 1.5rem 2rem;
}

.signin-page__signed {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.signin-page__composer {
  display: flex;
  flex-direction: column;
}

.signin-page__composer label {
  margin: 1.5rem 0 0.4rem;
  color: var(--cc98-color-text-muted);
  font-size: 0.75rem;
}

.signin-page__composer textarea {
  width: 100%;
  height: 10rem;
  padding: 0.75rem;
  border: 1px solid var(--cc98-color-border);
  border-radius: 3px;
  background: var(--cc98-color-surface);
  color: var(--cc98-color-text);
  font: inherit;
  font-size: 0.875rem;
  line-height: 1.6;
  resize: vertical;
}

.signin-page__composer textarea:focus {
  border-color: var(--cc98-color-primary);
  outline: 0;
}

.signin-page__composer > button {
  width: 6rem;
  height: 2rem;
  align-self: center;
  border: 0;
  border-radius: 3px;
  margin: 1.25rem 0;
  background: var(--cc98-color-primary-fill);
  color: #fff;
  cursor: pointer;
  font: inherit;
  letter-spacing: 0.3125rem;
}

.signin-page__composer > button:disabled,
.signin-calendar button:disabled {
  cursor: default;
  opacity: 0.5;
}

.signin-page__feedback {
  margin: -0.5rem 0 0;
  color: var(--cc98-color-success);
  text-align: center;
}

.signin-page__feedback--error {
  color: var(--cc98-color-error);
}

.signin-page__state {
  margin-top: 1.5rem;
}

.signin-calendar {
  min-height: 43.75rem;
  margin-top: 2.5rem;
}

.signin-calendar__toolbar,
.signin-calendar__picker,
.signin-calendar__panel {
  border: 1px solid var(--cc98-color-border);
  border-radius: 8px;
  background: var(--cc98-color-surface);
}

.signin-calendar__toolbar {
  position: relative;
  display: flex;
  min-height: 4rem;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  color: var(--cc98-color-text);
}

.signin-calendar__rules {
  position: relative;
}

.signin-calendar__rules summary {
  display: grid;
  width: 1.5rem;
  height: 1.5rem;
  padding: 0;
  border: 0;
  color: var(--cc98-color-text-muted);
  cursor: pointer;
  list-style: none;
  place-items: center;
}

.signin-calendar__rules summary::-webkit-details-marker {
  display: none;
}

.signin-calendar__rules summary svg {
  width: 1.1rem;
  height: 1.1rem;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.signin-calendar__rules-popover {
  position: absolute;
  top: 1.8rem;
  left: -5rem;
  z-index: 20;
  width: 30rem;
  padding: 0.875rem 1rem;
  border: 1px solid var(--cc98-color-border);
  border-radius: 4px;
  background: var(--cc98-color-surface);
  box-shadow: 0 0.35rem 1rem rgb(0 0 0 / 0.16);
  color: var(--cc98-color-text);
  font-size: 0.8125rem;
  line-height: 1.7;
}

.signin-calendar__rules-popover strong {
  display: block;
  margin-bottom: 0.35rem;
}

.signin-calendar__makeup {
  height: 2rem;
  padding: 0 1rem;
  border: 0;
  border-radius: 4px;
  margin-left: 0.25rem;
  background: var(--cc98-color-primary-fill);
  color: #fff;
  cursor: pointer;
  font: inherit;
  font-size: 0.875rem;
}

.signin-calendar__picker {
  display: flex;
  min-height: 4rem;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  margin-top: 0.625rem;
}

.signin-calendar__picker input {
  width: 12rem;
  height: 2rem;
  padding: 0 0.6rem;
  border: 1px solid var(--cc98-color-border);
  border-radius: 4px;
  background: var(--cc98-color-surface);
  color: var(--cc98-color-text);
  font: inherit;
  font-size: 0.875rem;
}

.signin-calendar__month-buttons {
  display: flex;
}

.signin-calendar__month-buttons button {
  display: inline-flex;
  height: 2rem;
  align-items: center;
  gap: 0.2rem;
  padding: 0 0.7rem;
  border: 1px solid var(--cc98-color-border);
  background: var(--cc98-color-surface);
  color: var(--cc98-color-text);
  cursor: pointer;
  font: inherit;
  font-size: 0.875rem;
}

.signin-calendar__month-buttons button:first-child {
  border-radius: 4px 0 0 4px;
}

.signin-calendar__month-buttons button:last-child {
  border-left: 0;
  border-radius: 0 4px 4px 0;
}

.signin-calendar__month-buttons button:not(:disabled):hover {
  border-color: var(--cc98-color-primary);
  color: var(--cc98-color-primary);
}

.signin-calendar__month-buttons svg {
  width: 1rem;
  height: 1rem;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.signin-calendar__picker > span {
  margin-left: 0.25rem;
  font-size: 0.875rem;
}

.signin-calendar__panel {
  padding: 1rem;
  margin-top: 0.625rem;
}

.signin-calendar__weekdays,
.signin-calendar__grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  text-align: center;
}

.signin-calendar__weekdays {
  margin-bottom: 0.5rem;
  font-weight: 700;
}

.signin-calendar__grid {
  gap: 4px;
}

.signin-calendar__grid-slot {
  min-height: 5rem;
  padding: 2px;
}

.signin-calendar__cell {
  min-height: 4.75rem;
  padding: 0.625rem 0;
  border-radius: 4px;
}

.signin-calendar__cell--signed,
.signin-calendar__cell--makeup {
  background: color-mix(in srgb, var(--cc98-color-success) 8%, var(--cc98-color-surface));
  color: var(--cc98-color-success);
}

.signin-calendar__tag {
  display: block;
  width: fit-content;
  min-width: 1.5rem;
  padding: 0 0.25rem;
  border-radius: 4px;
  margin: 0.25rem auto 0;
  font-size: 0.875rem;
}

.signin-calendar__tag--makeup {
  background: #66ccff;
  color: #fff;
}

.signin-calendar__tag--missed {
  background: var(--cc98-color-error);
  color: #fff;
}

.signin-calendar__state {
  min-height: 24rem;
  margin-top: 0.625rem;
}

@media (max-width: 900px) {
  .signin-page {
    padding: 1.25rem;
  }

  .signin-calendar__picker {
    align-items: flex-start;
    flex-direction: column;
  }

  .signin-calendar__rules-popover {
    width: min(30rem, calc(100vw - 5rem));
  }
}
</style>
