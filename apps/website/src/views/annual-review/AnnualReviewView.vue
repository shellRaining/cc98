<script setup lang="ts">
import { computed, ref, watch } from "vue";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/vue-query";
import { useTitle } from "@vueuse/core";
import { useRoute, useRouter } from "vue-router";
import { annualReviewQuery, boardsByIdsQuery, currentUserQuery } from "../../api/queries";
import FullPageStatus from "../../components/FullPageStatus.vue";
import PageState from "../../components/PageState.vue";
import { resolveAvatarUrl } from "../../components/user/avatar";
import {
  annualReviewAchievements,
  annualReviewPages,
  annualReviewWinRate,
  resolveFavoritePostPeriod,
  type AnnualReviewPage,
} from "./pages";
import { normalizeApiError } from "../../lib/api-error";
import { saveLoginRedirect } from "../../lib/login-redirect";
import { useUserStore } from "../../stores/user";

const YEAR = 2025;
const route = useRoute();
const router = useRouter();
const user = useUserStore();
const authScope = computed(() => user.user?.id ?? "anonymous");
const reviewQuery = useQuery(
  computed(() => annualReviewQuery(YEAR, authScope.value, user.isLoggedIn)),
);
const profileQuery = useQuery({ ...currentUserQuery, enabled: () => user.isLoggedIn });
const data = computed(() => reviewQuery.data.value ?? null);
const profile = computed(() => profileQuery.data.value ?? null);
useTitle(`${YEAR} 年度总结 - CC98 论坛`);

const pageIndex = ref(0);
const pages = computed(() => (data.value ? annualReviewPages(data.value) : []));
const currentPage = computed<AnnualReviewPage>(() => pages.value[pageIndex.value] ?? "cover");
const canPrevious = computed(() => pageIndex.value > 0);
const canNext = computed(() => pageIndex.value < pages.value.length - 1);
const pageAnnouncement = computed(
  () => `第 ${pageIndex.value + 1} 页，共 ${pages.value.length} 页`,
);

watch(
  () => pages.value.length,
  (length) => {
    if (length === 0) pageIndex.value = 0;
    else if (pageIndex.value >= length) pageIndex.value = length - 1;
  },
);

const boardIds = computed(() => {
  if (!data.value) return [];
  return [...new Set([data.value.board1, data.value.board2, data.value.board3])].filter(
    (id): id is number => typeof id === "number" && id > 0,
  );
});
const boardQuery = useQuery(
  computed(() => boardsByIdsQuery(boardIds.value, boardIds.value.length > 0)),
);
const boardMap = computed(
  () => new Map((boardQuery.data.value ?? []).map((board) => [board.id, board.name])),
);
const favoritePeriod = computed(() => (data.value ? resolveFavoritePostPeriod(data.value) : null));
const achievements = computed(() => annualReviewAchievements(data.value?.achievement));
const winRate = computed(() => (data.value ? annualReviewWinRate(data.value) : "0.0%"));
const timeBars = computed(() => [
  { label: "上午", count: data.value?.postCount612 ?? 0 },
  { label: "下午", count: data.value?.postCount1218 ?? 0 },
  { label: "晚上", count: data.value?.postCount1824 ?? 0 },
  { label: "深夜", count: data.value?.postCount06 ?? 0 },
]);
const maxTimeCount = computed(() => Math.max(1, ...timeBars.value.map((item) => item.count)));

const pageState = computed(() => {
  if (!user.isLoggedIn) return "unauthorized" as const;
  if (reviewQuery.isPending.value || profileQuery.isPending.value) return "loading" as const;
  const error = reviewQuery.error.value ?? profileQuery.error.value;
  if (error) return normalizeApiError(error).kind;
  if (!data.value || !profile.value) return "not-found" as const;
  return null;
});

function goLogin() {
  saveLoginRedirect(route.fullPath);
  void router.push({ name: "logon" });
}

function previousPage() {
  if (canPrevious.value) pageIndex.value -= 1;
}

function nextPage() {
  if (canNext.value) pageIndex.value += 1;
}

const clickAdvancePages = new Set<AnnualReviewPage>([
  "overview",
  "likes",
  "topics",
  "ratings",
  "boards",
]);

function handleCardClick(event: MouseEvent) {
  if ((event.target as HTMLElement).closest("a, button")) return;
  if (clickAdvancePages.has(currentPage.value)) nextPage();
}

let lastWheelAt = 0;
function handleWheel(event: WheelEvent) {
  if (Math.abs(event.deltaY) < 20) return;
  const now = Date.now();
  if (now - lastWheelAt < 420) return;
  lastWheelAt = now;
  if (event.deltaY > 0) nextPage();
  else previousPage();
}

function handleKeydown(event: KeyboardEvent) {
  if (["ArrowDown", "PageDown", " "].includes(event.key)) {
    event.preventDefault();
    nextPage();
  } else if (["ArrowUp", "PageUp"].includes(event.key)) {
    event.preventDefault();
    previousPage();
  } else if (event.key === "Home") {
    event.preventDefault();
    pageIndex.value = 0;
  } else if (event.key === "End") {
    event.preventDefault();
    pageIndex.value = Math.max(0, pages.value.length - 1);
  }
}

function avatarUrl(value?: string | null) {
  return resolveAvatarUrl(value);
}

function formatDate(value?: string | null) {
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("YYYY 年 M 月 D 日") : "某一天";
}

function formatTime(value?: string | null) {
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("HH:mm") : "很晚";
}
</script>

<template>
  <FullPageStatus v-if="pageState === 'unauthorized'" kind="unauthorized" @login="goLogin" />
  <section v-else class="annual-review-view">
    <h1 class="sr-only">{{ YEAR }} 年度总结</h1>
    <PageState
      v-if="pageState"
      :kind="pageState"
      :message="
        reviewQuery.error.value || profileQuery.error.value
          ? normalizeApiError(reviewQuery.error.value ?? profileQuery.error.value).message
          : undefined
      "
      :show-retry="pageState === 'error'"
      @retry="reviewQuery.refetch()"
    />

    <div
      v-else-if="data && profile"
      class="annual-review-shell"
      tabindex="0"
      :aria-label="`${YEAR} 年度总结，${pageAnnouncement}`"
      @keydown="handleKeydown"
    >
      <button
        type="button"
        class="annual-review-arrow"
        :class="{ 'is-hidden': !canPrevious }"
        :disabled="!canPrevious"
        aria-label="上一页"
        @click="previousPage"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 15 7-7 7 7" /></svg>
      </button>

      <div class="annual-review-stage" @wheel.prevent="handleWheel">
        <Transition name="annual-review-card" mode="out-in">
          <article
            :key="currentPage"
            class="annual-review-page"
            :class="{
              'annual-review-page--cover': currentPage === 'cover',
              'annual-review-page--cat': [
                'overview',
                'topics',
                'boards',
                'card-draw',
                'achievements',
              ].includes(currentPage),
              'annual-review-page--rabbit': ['likes', 'ratings', 'time', 'bet'].includes(
                currentPage,
              ),
              'is-clickable': clickAdvancePages.has(currentPage),
            }"
            @click="handleCardClick"
          >
            <span v-if="currentPage === 'cover'" class="sr-only">{{ YEAR }} 年度总结封面</span>

            <div v-else-if="currentPage === 'overview'" class="annual-review-copy">
              <p class="annual-review-greeting">亲爱的 CC98 用户 {{ profile.name }}：</p>
              <img
                class="annual-review-avatar"
                :src="avatarUrl(profile.portraitUrl)"
                :alt="`${profile.name} 的头像`"
              />
              <p>
                在过去的 {{ YEAR }} 年里，你有 <strong>{{ data.postDay ?? 0 }}</strong> 天
              </p>
              <p>在 CC98 论坛上留下了痕迹。</p>
              <p class="annual-review-space-top">
                你发表了 <strong>{{ data.topicCount ?? 0 }}</strong> 个主题帖，
              </p>
              <p>
                进行了 <strong>{{ data.replyCount ?? 0 }}</strong> 次回复，
              </p>
              <p v-if="data.favoriteTopicCount">
                新收藏了 <strong>{{ data.favoriteTopicCount }}</strong> 个主题帖，
              </p>
              <p v-if="data.hotTopicCount">
                上了 <strong>{{ data.hotTopicCount }}</strong> 次十大热门话题。
              </p>
              <div v-else class="annual-review-space-top">
                <p>很遗憾，</p>
                <p>你的主题帖没上过十大热门话题。</p>
              </div>
            </div>

            <div v-else-if="currentPage === 'likes'" class="annual-review-copy">
              <p>
                你一共送出了 <strong>{{ data.sendLikeCount ?? 0 }}</strong> 个赞。
              </p>
              <div v-if="data.mostSendLikeUser">
                <p>
                  你最欣赏的用户是 <strong>{{ data.mostSendLikeUser.userName }}</strong
                  >，
                </p>
                <img
                  class="annual-review-avatar"
                  :src="avatarUrl(data.mostSendLikeUser.portraitUrl)"
                  :alt="`${data.mostSendLikeUser.userName ?? '用户'} 的头像`"
                />
                <p>
                  给 Ta 点了 <strong>{{ data.mostSendLikeUser.likeCount ?? 0 }}</strong> 个赞。
                </p>
              </div>
              <p class="annual-review-space-top">
                你一共收到了他人的 <strong>{{ data.receiveLikeCount ?? 0 }}</strong> 个赞。
              </p>
              <div v-if="data.mostReceiveLikeUser">
                <p>
                  用户 <strong>{{ data.mostReceiveLikeUser.userName }}</strong> 是你的首席鼓励师，
                </p>
                <img
                  class="annual-review-avatar"
                  :src="avatarUrl(data.mostReceiveLikeUser.portraitUrl)"
                  :alt="`${data.mostReceiveLikeUser.userName ?? '用户'} 的头像`"
                />
                <p>
                  Ta 给你点了 <strong>{{ data.mostReceiveLikeUser.likeCount ?? 0 }}</strong> 个赞。
                </p>
              </div>
            </div>

            <div v-else-if="currentPage === 'topics'" class="annual-review-copy">
              <template v-if="data.mostReplyTopicCount || data.mostViewTopicCount">
                <p>在你一年发表的主题帖中，</p>
                <div v-if="data.mostReplyTopicCount" class="annual-review-space-top">
                  <p>收到最多回复的一次，</p>
                  <p>
                    共有 <strong>{{ data.mostReplyTopicCount }}</strong> 个回复；
                  </p>
                </div>
                <div v-if="data.mostViewTopicCount" class="annual-review-space-top">
                  <p>点击量最多的一次，</p>
                  <p>
                    共有 <strong>{{ data.mostViewTopicCount }}</strong> 次点击。
                  </p>
                </div>
              </template>
              <p v-else>在过去的一年里，<br />你没有发过主题帖...</p>
            </div>

            <div v-else-if="currentPage === 'ratings'" class="annual-review-copy">
              <div v-if="data.mostReceiveLikePostCount">
                <p>你收获他人点赞最多的一个发言，</p>
                <p>
                  共收到了 <strong>{{ data.mostReceiveLikePostCount }}</strong> 个赞。
                </p>
              </div>
              <p class="annual-review-space-top">
                你给他人评分 <strong>{{ data.sendRateCount ?? 0 }}</strong> 次，
              </p>
              <p>
                收到了他人给你的 <strong>{{ data.receiveRateCount ?? 0 }}</strong> 次评分。
              </p>
              <div class="annual-review-space-top">
                <template v-if="(data.sofaCount ?? 0) > 20">
                  <p>你眼疾手快，</p>
                  <p>
                    抢到了 <strong>{{ data.sofaCount }}</strong> 次沙发。
                  </p>
                </template>
                <template v-else-if="(data.sofaCount ?? 0) > 0">
                  <p>你手速尚可，</p>
                  <p>
                    抢到了 <strong>{{ data.sofaCount }}</strong> 次沙发。
                  </p>
                </template>
                <template v-else>
                  <p>你佛系水帖，</p>
                  <p>从未抢到过沙发。</p>
                </template>
              </div>
            </div>

            <div v-else-if="currentPage === 'boards'" class="annual-review-copy">
              <template v-if="boardIds.length">
                <p>你最爱发言的版面是：</p>
                <p v-for="(boardId, index) in boardIds" :key="boardId">
                  <RouterLink :to="`/list/${boardId}`" :class="`annual-review-rank-${index + 1}`">
                    {{ boardMap.get(boardId) ?? `版面 ${boardId}` }}
                  </RouterLink>
                </p>
              </template>
              <template v-else>
                <p>你在过去的一年中没有发言，</p>
                <p>新的一年要加油哦~</p>
              </template>
              <template v-if="data.latestPostTime">
                <p class="annual-review-space-top">
                  在 <strong>{{ formatDate(data.latestPostTime) }}</strong> 这天，
                </p>
                <p>你熬夜得最晚，</p>
                <p>
                  <strong>{{ formatTime(data.latestPostTime) }}</strong> 还在 98 发言。
                </p>
              </template>
            </div>

            <div v-else-if="currentPage === 'time'" class="annual-review-copy annual-review-time">
              <p v-if="favoritePeriod" class="annual-review-period">
                你最喜欢在 <strong>{{ favoritePeriod }}</strong> 水 98。
              </p>
              <p>你发言的时间段统计如下：</p>
              <div class="annual-review-chart" aria-label="发言时段柱状图">
                <div v-for="item in timeBars" :key="item.label" class="annual-review-bar-item">
                  <span class="annual-review-bar-value">{{ item.count }}</span>
                  <span
                    class="annual-review-bar"
                    :style="{ height: `${Math.max(4, (item.count / maxTimeCount) * 100)}%` }"
                  />
                  <span>{{ item.label }}</span>
                </div>
              </div>
            </div>

            <div
              v-else-if="currentPage === 'card-draw' && data.cardDraw"
              class="annual-review-copy"
            >
              <p>在 CC98 抽卡游戏中，</p>
              <p>迄今为止你共获得了：</p>
              <p>
                <strong>{{ data.cardDraw.totalMysteryCount ?? 0 }}</strong> 张 Mystery 卡、
              </p>
              <p>
                <strong>{{ data.cardDraw.totalSSRCount ?? 0 }}</strong> 张 SSR 卡、
                <strong>{{ data.cardDraw.totalSRCount ?? 0 }}</strong> 张 SR 卡、
              </p>
              <p>
                <strong>{{ data.cardDraw.totalRCount ?? 0 }}</strong> 张 R 卡、
                <strong>{{ data.cardDraw.totalNCount ?? 0 }}</strong> 张 N 卡。
              </p>
              <div class="annual-review-space-top">
                <p>其中在 {{ YEAR }} 年，</p>
                <p>
                  你消耗了 <strong>{{ data.cardDraw.annualPayment ?? 0 }}</strong> 财富值，
                </p>
                <p>
                  获得了 <strong>{{ data.cardDraw.annualCount ?? 0 }}</strong> 张卡片。
                </p>
              </div>
            </div>

            <div v-else-if="currentPage === 'bet' && data.bet" class="annual-review-copy">
              <p>在 CC98 竞猜游戏中，</p>
              <p>
                本年度你共参与了 <strong>{{ data.bet.totalCount ?? 0 }}</strong> 场竞猜，
              </p>
              <p>
                胜利 <strong>{{ data.bet.winCount ?? 0 }}</strong> 场、
              </p>
              <p>
                失败 <strong>{{ data.bet.loseCount ?? 0 }}</strong> 场、
              </p>
              <p>
                走水 <strong>{{ data.bet.drawCount ?? 0 }}</strong> 场，
              </p>
              <p>
                胜率为 <strong>{{ winRate }}</strong
                >。
              </p>
              <div class="annual-review-space-top">
                <p>
                  共投注了 <strong>{{ data.bet.payment ?? 0 }}</strong> 财富值，
                </p>
                <p v-if="(data.bet.profit ?? 0) >= 0">
                  赢得了 <strong>{{ data.bet.profit ?? 0 }}</strong> 财富值，不错呀！
                </p>
                <p v-else>
                  损失了 <strong>{{ Math.abs(data.bet.profit ?? 0) }}</strong> 财富值，不要灰心哦~
                </p>
              </div>
            </div>

            <div v-else-if="currentPage === 'achievements'" class="annual-review-copy">
              <p>你获得了以下成就：</p>
              <div v-if="achievements.length" class="annual-review-achievements">
                <span v-for="(achievement, index) in achievements" :key="`${achievement}-${index}`">
                  {{ achievement }}
                </span>
              </div>
              <div class="annual-review-blessing">
                <p>在新春佳节到来之际，</p>
                <p>CC98 论坛祝你：</p>
                <strong>身体健康</strong>
                <strong>学习生活顺利</strong>
                <strong>幸福 {{ YEAR + 1 }}</strong>
              </div>
            </div>
          </article>
        </Transition>
      </div>

      <button
        type="button"
        class="annual-review-arrow"
        :class="{ 'is-hidden': !canNext }"
        :disabled="!canNext"
        aria-label="下一页"
        @click="nextPage"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 9 7 7 7-7" /></svg>
      </button>
      <p class="sr-only" aria-live="polite">{{ pageAnnouncement }}</p>
    </div>
  </section>
</template>

<style scoped>
.annual-review-view {
  min-height: 51rem;
  color: #000;
}

.annual-review-shell {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  outline: none;
}

.annual-review-shell:focus-visible {
  outline: 2px solid var(--cc98-color-primary);
  outline-offset: 4px;
}

.annual-review-stage {
  display: grid;
  place-items: center;
}

.annual-review-page {
  display: flex;
  height: min(76.8vh, 48rem);
  aspect-ratio: 5 / 8;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background-position: center;
  background-repeat: no-repeat;
  background-size: 100% 100%;
  font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
  font-size: clamp(1rem, 2.5vh, 1.56rem);
  line-height: 1.45;
  user-select: none;
}

.annual-review-page.is-clickable {
  cursor: pointer;
}

.annual-review-page--cover {
  position: relative;
  background-image: url("../../assets/annual-review/cover2025.jpg");
}

.annual-review-page--cat {
  background-image: url("../../assets/annual-review/bg-cat.jpg");
}

.annual-review-page--rabbit {
  background-image: url("../../assets/annual-review/bg-rabbit.jpg");
}

.annual-review-copy {
  display: flex;
  width: 100%;
  max-height: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
}

.annual-review-copy > *,
.annual-review-copy > div > * {
  animation: annual-review-entry 0.55s ease both;
}

.annual-review-copy > :nth-child(2) {
  animation-delay: 0.08s;
}

.annual-review-copy > :nth-child(3) {
  animation-delay: 0.16s;
}

.annual-review-copy > :nth-child(4) {
  animation-delay: 0.24s;
}

.annual-review-copy > :nth-child(n + 5) {
  animation-delay: 0.32s;
}

.annual-review-copy p {
  margin: 0.1rem 0;
}

.annual-review-copy strong,
.annual-review-copy a {
  padding-inline: 2px;
  color: #ff69b4;
  font-size: 1.25em;
  font-weight: 700;
}

.annual-review-copy a:visited {
  color: #ff69b4;
}

.annual-review-greeting {
  font-weight: 700;
}

.annual-review-avatar {
  width: 3.75rem;
  height: 3.75rem;
  margin-block: 0.5rem;
  border-radius: 50%;
  object-fit: cover;
}

.annual-review-space-top {
  margin-top: 1.25rem !important;
}

.annual-review-rank-1,
.annual-review-rank-2,
.annual-review-rank-3 {
  display: inline-block;
  margin-block: 0.1rem;
}

.annual-review-time {
  padding-top: 5rem;
}

.annual-review-period {
  margin-bottom: 2rem !important;
}

.annual-review-chart {
  display: flex;
  width: 82%;
  height: 14rem;
  align-items: end;
  justify-content: center;
  gap: 1.25rem;
  margin-top: 1.25rem;
  padding: 1rem 1rem 0.75rem;
  border-bottom: 1px solid rgb(0 0 0 / 0.3);
}

.annual-review-bar-item {
  display: grid;
  height: 100%;
  min-width: 2.5rem;
  grid-template-rows: 1.5rem minmax(0, 1fr) 1.75rem;
  align-items: end;
  justify-items: center;
  font-size: 0.68em;
}

.annual-review-bar {
  width: 2.1rem;
  min-height: 4px;
  border-radius: 2px 2px 0 0;
  background: #5198d8;
}

.annual-review-bar-value {
  align-self: end;
}

.annual-review-achievements {
  display: flex;
  max-height: 12rem;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
  margin: 0.75rem 1rem 0;
  overflow: auto;
}

.annual-review-achievements span {
  padding: 0.2rem 0.55rem;
  border: 1px solid #ff85c0;
  border-radius: 4px;
  background: #fff0f6;
  color: #c41d7f;
  font-size: 0.75em;
}

.annual-review-achievements span:nth-child(4n + 2) {
  border-color: #ff9c6e;
  background: #fff2e8;
  color: #ad2102;
}

.annual-review-achievements span:nth-child(4n + 3) {
  border-color: #ffd666;
  background: #fffbe6;
  color: #ad6800;
}

.annual-review-achievements span:nth-child(4n) {
  border-color: #b7eb8f;
  background: #f6ffed;
  color: #389e0d;
}

.annual-review-blessing {
  display: flex;
  flex-direction: column;
  margin-top: 2rem;
}

.annual-review-blessing strong {
  display: block;
}

.annual-review-arrow {
  display: grid;
  width: 2.5rem;
  height: 2.5rem;
  place-items: center;
  border: 0;
  background: transparent;
  color: var(--cc98-color-text);
  cursor: pointer;
}

.annual-review-arrow svg {
  width: 2rem;
  height: 2rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.annual-review-arrow.is-hidden {
  visibility: hidden;
}

.annual-review-card-enter-active,
.annual-review-card-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.annual-review-card-enter-from {
  opacity: 0;
  transform: translateY(1.5rem);
}

.annual-review-card-leave-to {
  opacity: 0;
  transform: translateY(-1.5rem);
}

@keyframes annual-review-entry {
  from {
    opacity: 0;
    transform: translateY(1.5rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .annual-review-copy > *,
  .annual-review-copy > div > *,
  .annual-review-card-enter-active,
  .annual-review-card-leave-active {
    animation: none;
    transition: none;
  }
}
</style>
