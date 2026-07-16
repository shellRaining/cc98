<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import dayjs from "dayjs";
import { computed } from "vue";
import { RouterLink } from "vue-router";
import { boardsByIdsQuery, currentUserQuery, meRecentTopicsQuery } from "../../api/queries";
import PageState from "../../components/PageState.vue";
import ContentRenderer from "../../components/rich-content/ContentRenderer.vue";
import { normalizeApiError } from "../../lib/api-error";
import { useUserStore } from "../../stores/user";

const PAGE_SIZE = 10;
const user = useUserStore();
const authScope = computed(() => user.user?.id ?? "anonymous");

const meQuery = useQuery(currentUserQuery);
const recentQuery = useQuery(
  computed(() => meRecentTopicsQuery(authScope.value, 0, PAGE_SIZE + 1, user.isLoggedIn)),
);

const recentTopics = computed(() => recentQuery.data.value?.slice(0, PAGE_SIZE) ?? []);
const boardIds = computed(() => recentTopics.value.map((topic) => topic.boardId ?? 0));
const boardQuery = useQuery(computed(() => boardsByIdsQuery(boardIds.value)));
const boardMap = computed(
  () => new Map(boardQuery.data.value?.map((board) => [board.id, board]) ?? []),
);
const avatar = computed(
  () =>
    meQuery.data.value?.portraitUrl ||
    meQuery.data.value?.photourl ||
    "/static/images/default_avatar_boy.png",
);

const profileFields = computed(() => {
  const me = meQuery.data.value;
  if (!me) return [];
  return [
    ["性别", formatGender(me.gender)],
    ["发帖数", me.postCount ?? "—"],
    ["财富值", me.wealth ?? "—"],
    ["粉丝数", me.fanCount ?? "—"],
    ["威望", me.prestige ?? "—"],
    ["风评", me.popularity ?? "—"],
    ["注册时间", formatTime(me.registerTime)],
    ["最后登录", formatTime(me.lastLogOnTime)],
    ...(me.birthday ? ([["生日", me.birthday.replace("9999-", "")]] as const) : []),
    ...(me.displayTitle || me.levelTitle
      ? ([["用户组", me.displayTitle || me.levelTitle || "—"]] as const)
      : []),
    ...(me.emailAddress ? ([["邮箱", me.emailAddress]] as const) : []),
    ...(me.qq ? ([["QQ", me.qq]] as const) : []),
    ["被删帖数", Math.max(0, -(me.deleteCount ?? 0))],
  ] as const;
});

const errorMessage = computed(() => {
  const error = meQuery.error.value ?? recentQuery.error.value ?? boardQuery.error.value;
  return error ? normalizeApiError(error).message : undefined;
});

function formatGender(gender: number | undefined): string {
  if (gender === 1) return "男";
  if (gender === 2) return "女";
  return "未设置";
}

function formatTime(value: string | undefined): string {
  if (!value) return "—";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD HH:mm") : value;
}

function replaceBrokenAvatar(event: Event) {
  const image = event.currentTarget as HTMLImageElement;
  image.src = "/static/images/default_avatar_boy.png";
}

function retry() {
  void meQuery.refetch();
  void recentQuery.refetch();
  void boardQuery.refetch();
}
</script>

<template>
  <PageState v-if="meQuery.isPending.value" kind="loading" />
  <PageState
    v-else-if="meQuery.error.value"
    kind="error"
    :message="errorMessage"
    show-retry
    @retry="retry"
  />

  <div v-else-if="meQuery.data.value" class="user-center-profile">
    <aside class="user-center-profile__avatar">
      <img :src="avatar" :alt="`${meQuery.data.value.name} 的头像`" @error="replaceBrokenAvatar" />
    </aside>

    <section class="user-center-profile__details">
      <header class="user-center-profile__identity">
        <div>
          <strong>{{ meQuery.data.value.name }}</strong>
          <span>{{ meQuery.data.value.privilege }}</span>
        </div>
        <dl class="user-center-like-count">
          <dt>收到的赞</dt>
          <dd>{{ meQuery.data.value.receivedLikeCount ?? 0 }}</dd>
        </dl>
      </header>

      <p v-if="meQuery.data.value.introduction" class="user-center-profile__introduction">
        {{ meQuery.data.value.introduction }}
      </p>

      <dl class="user-center-profile__fields">
        <div v-for="[label, value] in profileFields" :key="label">
          <dt>{{ label }}</dt>
          <dd>{{ value }}</dd>
        </div>
      </dl>

      <section v-if="meQuery.data.value.signatureCode" class="user-center-signature">
        <h2>个性签名</h2>
        <div class="user-center-signature__content">
          <ContentRenderer type="ubb" :content="meQuery.data.value.signatureCode" />
        </div>
      </section>
    </section>

    <section class="user-center-activities">
      <header>
        <h2>发表的主题</h2>
        <RouterLink to="/usercenter/topics">查看全部</RouterLink>
      </header>

      <PageState v-if="recentQuery.isPending.value" kind="loading" />
      <PageState
        v-else-if="recentQuery.error.value"
        kind="error"
        :message="errorMessage"
        show-retry
        @retry="retry"
      />
      <p v-else-if="recentTopics.length === 0" class="user-center-activities__empty">没有主题</p>
      <ul v-else class="user-center-topic-list">
        <li v-for="topic in recentTopics" :key="topic.id">
          <div class="user-center-topic-list__meta">
            <RouterLink :to="`/list/${topic.boardId}`">
              {{ boardMap.get(topic.boardId ?? 0)?.name ?? `版面 ${topic.boardId}` }}
            </RouterLink>
            <time>{{ formatTime(topic.time) }}</time>
          </div>
          <RouterLink :to="`/topic/${topic.id}`" class="user-center-topic-list__title">
            {{ topic.title?.trim() || "(无标题)" }}
          </RouterLink>
        </li>
      </ul>

      <RouterLink
        v-if="(recentQuery.data.value?.length ?? 0) > PAGE_SIZE"
        to="/usercenter/topics"
        class="user-center-activities__more"
      >
        查看更多主题
      </RouterLink>
    </section>
  </div>
</template>
