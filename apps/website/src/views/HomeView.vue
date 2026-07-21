<script setup lang="ts">
import type { HomepageTopicItem } from "../components/home/model";
import { computed } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { homepageIndexQuery, hotTopicsQuery } from "../api/queries";
import HomeForumStats from "../components/home/HomeForumStats.vue";
import HomeRecommendedReading from "../components/home/HomeRecommendedReading.vue";
import HomeTopicPanel from "../components/home/HomeTopicPanel.vue";
import PageState from "../components/PageState.vue";
import { normalizeApiError } from "../lib/api-error";
import { normalizeHomepageTopic, visibleHomepageColumns } from "../components/home/model";
import { hotTopicsPath } from "../router/links";

const { data: index, error, isPending, refetch } = useQuery(homepageIndexQuery);
const { data: weeklyHotTopics } = useQuery(hotTopicsQuery("weekly"));
const { data: monthlyHotTopics } = useQuery(hotTopicsQuery("monthly"));
const { data: historicalHotTopics } = useQuery(hotTopicsQuery("history"));

function normalizeTopics(
  topics:
    | readonly { id?: number; title?: string; boardId?: number; boardName?: string }[]
    | null
    | undefined,
  limit = 10,
): HomepageTopicItem[] {
  return (topics ?? [])
    .map(normalizeHomepageTopic)
    .filter((topic): topic is HomepageTopicItem => topic != null)
    .slice(0, limit);
}

const todayHotTopics = computed(() => normalizeTopics(index.value?.hotTopic));
const recommendedReading = computed(() =>
  visibleHomepageColumns(index.value?.recommendationReading),
);
const weeklyTopics = computed(() => normalizeTopics(weeklyHotTopics.value));
const monthlyTopics = computed(() => normalizeTopics(monthlyHotTopics.value));
const historyTopics = computed(() => normalizeTopics(historicalHotTopics.value));
const schoolEvents = computed(() => normalizeTopics(index.value?.schoolEvent));
const academics = computed(() => normalizeTopics(index.value?.academics));
const study = computed(() => normalizeTopics(index.value?.study));
const emotion = computed(() => normalizeTopics(index.value?.emotion));
const fleaMarket = computed(() => normalizeTopics(index.value?.fleaMarket));
const fullTimeJobs = computed(() => normalizeTopics(index.value?.fullTimeJob));
const partTimeJobs = computed(() => normalizeTopics(index.value?.partTimeJob));
const pageError = computed(() => (error.value ? normalizeApiError(error.value) : null));
</script>

<template>
  <PageState v-if="isPending" kind="loading" />
  <PageState
    v-else-if="pageError"
    kind="error"
    :message="pageError.message"
    show-retry
    @retry="refetch()"
  />
  <div v-else-if="index" class="home-page">
    <HomeRecommendedReading :items="recommendedReading" />

    <div class="home-hot-topic-grid">
      <HomeTopicPanel title="今日热话题" :items="todayHotTopics" show-board />
      <HomeTopicPanel title="本周话题" :items="weeklyTopics">
        <template #actions>
          <RouterLink :to="hotTopicsPath('weekly')">更多</RouterLink>
        </template>
      </HomeTopicPanel>
      <HomeTopicPanel title="本月话题" :items="monthlyTopics">
        <template #actions><RouterLink :to="hotTopicsPath('monthly')">更多</RouterLink></template>
      </HomeTopicPanel>
      <HomeTopicPanel title="历史上的今天" :items="historyTopics">
        <template #actions><RouterLink :to="hotTopicsPath('history')">更多</RouterLink></template>
      </HomeTopicPanel>
    </div>

    <div class="home-topic-grid">
      <HomeTopicPanel title="校园活动" :items="schoolEvents" />
      <HomeTopicPanel title="学术通知" :items="academics" tone="secondary" />
      <HomeTopicPanel title="学习园地" :items="study" tone="secondary">
        <template #actions>
          <RouterLink to="/list/68">学习</RouterLink>
          <RouterLink to="/list/304">外语</RouterLink>
          <RouterLink to="/list/263">考研</RouterLink>
          <RouterLink to="/list/102">出国</RouterLink>
        </template>
      </HomeTopicPanel>
      <HomeTopicPanel title="感性·情感" :items="emotion">
        <template #actions>
          <RouterLink to="/list/152">缘分</RouterLink>
          <RouterLink to="/list/114">小屋</RouterLink>
          <RouterLink to="/list/81">感性</RouterLink>
        </template>
      </HomeTopicPanel>
      <HomeTopicPanel title="跳蚤市场" :items="fleaMarket">
        <template #actions>
          <RouterLink to="/list/562">数码</RouterLink>
          <RouterLink to="/list/80">日用</RouterLink>
          <RouterLink to="/list/563">服饰</RouterLink>
        </template>
      </HomeTopicPanel>
      <HomeTopicPanel title="求职广场" :items="fullTimeJobs" tone="secondary">
        <template #actions><RouterLink to="/list/235">更多</RouterLink></template>
      </HomeTopicPanel>
      <HomeTopicPanel title="实习兼职" :items="partTimeJobs" tone="secondary">
        <template #actions><RouterLink to="/list/459">更多</RouterLink></template>
      </HomeTopicPanel>
    </div>

    <HomeForumStats
      class="home-floating-stats"
      :today-posts="index.todayCount"
      :today-topics="index.todayTopicCount"
      :topics="index.topicCount"
      :posts="index.postCount"
      :online="index.onlineUserCount"
      :users="index.userCount"
      :latest-user="index.lastUserName"
    />
  </div>
</template>

<style scoped>
.home-page {
  position: relative;
}

.home-hot-topic-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 2rem 1.25rem;
}

.home-topic-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 21rem), 1fr));
  gap: 2rem 1.25rem;
  margin-top: 2rem;
}

.home-floating-stats {
  position: absolute;
  top: 18rem;
  right: calc((100vw - 100%) / -2);
  z-index: 20;
}

@media (max-width: 640px) {
  .home-hot-topic-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .home-floating-stats {
    top: 13rem;
  }
}
</style>
