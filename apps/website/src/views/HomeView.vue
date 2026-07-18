<script setup lang="ts">
import type { HomepageTopicItem } from "../components/home/model";
import { computed } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { homepageAdvertisementsQuery, homepageIndexQuery } from "../api/queries";
import HomeAdvertisement from "../components/home/HomeAdvertisement.vue";
import HomeAnnouncement from "../components/home/HomeAnnouncement.vue";
import HomeForumStats from "../components/home/HomeForumStats.vue";
import HomeQrCard from "../components/home/HomeQrCard.vue";
import HomeRecommendedFunctions from "../components/home/HomeRecommendedFunctions.vue";
import HomeRecommendedReading from "../components/home/HomeRecommendedReading.vue";
import HomeSpecialOffers from "../components/home/HomeSpecialOffers.vue";
import HomeTopicPanel from "../components/home/HomeTopicPanel.vue";
import PageState from "../components/PageState.vue";
import { normalizeApiError } from "../lib/api-error";
import { normalizeHomepageTopic, visibleHomepageColumns } from "../components/home/model";
import { useUserStore } from "../stores/user";

const user = useUserStore();
const { data: index, error, isPending, refetch } = useQuery(homepageIndexQuery);
const { data: advertisements } = useQuery(homepageAdvertisementsQuery);

function normalizeTopics(
  topics:
    | readonly { id?: number; title?: string; boardId?: number; boardName?: string }[]
    | null
    | undefined,
): HomepageTopicItem[] {
  return (topics ?? [])
    .map(normalizeHomepageTopic)
    .filter((topic): topic is HomepageTopicItem => topic != null)
    .slice(0, 10);
}

const recommendedReading = computed(() =>
  visibleHomepageColumns(index.value?.recommendationReading),
);
const recommendedFunctions = computed(() =>
  visibleHomepageColumns(index.value?.recommendationFunction),
);
const specialOffers = computed(() => visibleHomepageColumns(index.value?.specialOffer));
const visibleAdvertisements = computed(() => visibleHomepageColumns(advertisements.value));
const hotTopics = computed(() => normalizeTopics(index.value?.hotTopic));
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
    <div class="home-main-column">
      <HomeAnnouncement :content="index.announcement || ''" />
      <HomeRecommendedReading :items="recommendedReading" />

      <div class="home-topic-grid">
        <HomeTopicPanel title="热门话题" :items="hotTopics" show-board>
          <template #actions>
            <RouterLink to="/topic/hot-weekly">本周</RouterLink>
            <RouterLink to="/topic/hot-monthly">本月</RouterLink>
            <RouterLink to="/topic/hot-history">历史上的今天</RouterLink>
          </template>
        </HomeTopicPanel>
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
    </div>

    <aside class="home-sidebar">
      <HomeRecommendedFunctions :items="recommendedFunctions" />
      <HomeAdvertisement :items="visibleAdvertisements" />
      <a
        class="home-suggestion"
        href="https://zju.aliwork.com/s/mailto?corpid=ding2c6bcab1e41b0242&ddtab=true"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img src="/home/suggestion.jpg" alt="校园意见箱" />
      </a>
      <HomeSpecialOffers v-if="user.isLoggedIn" :items="specialOffers" />
      <HomeForumStats
        :today-posts="index.todayCount"
        :today-topics="index.todayTopicCount"
        :topics="index.topicCount"
        :posts="index.postCount"
        :online="index.onlineUserCount"
        :users="index.userCount"
        :latest-user="index.lastUserName"
      />
      <HomeQrCard title="CC98小程序" src="/home/xiaochengxu.png" />
      <HomeQrCard title="98淘书小程序" src="/home/taoshu.jpg" />
      <HomeQrCard title="CC98公众号" src="/home/gongzhonghao.jpg" />
    </aside>
  </div>
</template>

<style scoped>
.home-page {
  display: grid;
  grid-template-columns: 51.25rem 18.75rem;
  gap: 1.25rem;
  align-items: start;
}

.home-main-column,
.home-sidebar {
  min-width: 0;
}

.home-topic-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 25rem));
  gap: 2rem 1.25rem;
}

.home-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.home-suggestion {
  position: relative;
  display: block;
  width: 100%;
  height: 6.25rem;
  overflow: hidden;
}

.home-suggestion img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (max-width: 1000px) {
  .home-page {
    grid-template-columns: minmax(0, 1fr);
  }

  .home-topic-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .home-sidebar {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
