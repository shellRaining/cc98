<script setup lang="ts">
import HomeSectionHeader from "./HomeSectionHeader.vue";

defineProps<{
  todayPosts?: number;
  todayTopics?: number;
  topics?: number;
  posts?: number;
  online?: number;
  users?: number;
  latestUser?: string;
}>();
</script>

<template>
  <section class="home-sidebar-block">
    <HomeSectionHeader title="论坛统计" />
    <dl class="home-forum-stats">
      <div>
        <dt>今日帖数</dt>
        <dd>{{ todayPosts ?? 0 }}</dd>
      </div>
      <div>
        <dt>今日主题数</dt>
        <dd>{{ todayTopics ?? 0 }}</dd>
      </div>
      <div>
        <dt>论坛总主题数</dt>
        <dd>{{ topics ?? 0 }}</dd>
      </div>
      <div>
        <dt>论坛总回复数</dt>
        <dd>{{ posts ?? 0 }}</dd>
      </div>
      <div>
        <dt>在线用户数</dt>
        <dd>{{ online ?? 0 }}</dd>
      </div>
      <div>
        <dt>总用户数</dt>
        <dd>{{ users ?? 0 }}</dd>
      </div>
      <div>
        <dt>欢迎新用户</dt>
        <dd>
          <RouterLink v-if="latestUser" :to="`/user/name/${encodeURIComponent(latestUser)}`">
            {{ latestUser }}
          </RouterLink>
          <template v-else>暂无</template>
        </dd>
      </div>
    </dl>
  </section>
</template>
