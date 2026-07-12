<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import { RouterLink } from "vue-router";
import { currentUserQuery } from "../../api/queries";
import PageState from "../../components/PageState.vue";
import { normalizeApiError } from "../../lib/api-error";

const { data: me, error, isPending, refetch } = useQuery(currentUserQuery);

const entries = [
  ["/usercenter/topics", "我的主题", "查看最近创建的主题"],
  ["/usercenter/posts", "我的回复", "查看最近回复与热门回复"],
  ["/usercenter/favorites", "我的收藏", "筛选收藏并管理分组"],
  ["/usercenter/history", "浏览历史", "查看最近访问的主题"],
  ["/usercenter/following", "关注用户", "管理已经关注的用户"],
  ["/usercenter/followers", "我的粉丝", "查看关注你的用户"],
  ["/usercenter/boards", "关注版面", "管理自定义版面"],
] as const;
</script>

<template>
  <div class="space-y-5">
    <header>
      <h1 class="text-2xl font-bold">用户中心</h1>
      <p class="mt-1 text-sm text-cc98-text-muted">管理个人内容、收藏和关注关系。</p>
    </header>

    <PageState v-if="isPending" kind="loading" />
    <PageState
      v-else-if="error"
      kind="error"
      :message="normalizeApiError(error).message"
      show-retry
      @retry="refetch()"
    />

    <template v-else>
      <div class="cc98-card p-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p class="text-xs text-cc98-text-muted">发帖数</p>
          <p class="mt-1 text-xl font-semibold">{{ me?.postCount ?? 0 }}</p>
        </div>
        <div>
          <p class="text-xs text-cc98-text-muted">关注</p>
          <p class="mt-1 text-xl font-semibold">{{ me?.followCount ?? 0 }}</p>
        </div>
        <div>
          <p class="text-xs text-cc98-text-muted">粉丝</p>
          <p class="mt-1 text-xl font-semibold">{{ me?.fanCount ?? 0 }}</p>
        </div>
        <div>
          <p class="text-xs text-cc98-text-muted">关注版面</p>
          <p class="mt-1 text-xl font-semibold">{{ me?.customBoards?.length ?? 0 }}</p>
        </div>
      </div>

      <ul class="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
        <li v-for="[to, title, description] in entries" :key="to">
          <RouterLink :to="to" class="cc98-card block p-4 hover:border-cc98-primary">
            <strong>{{ title }}</strong>
            <p class="mt-1 text-sm text-cc98-text-muted">{{ description }}</p>
          </RouterLink>
        </li>
      </ul>
    </template>
  </div>
</template>
