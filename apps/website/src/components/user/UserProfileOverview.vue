<script setup lang="ts">
import type { User } from "@cc98/api";
import { useQuery } from "@tanstack/vue-query";
import dayjs from "dayjs";
import { computed } from "vue";
import { displayTitlesQuery } from "../../api/queries";
import ContentRenderer from "../rich-content/ContentRenderer.vue";
import FramedAvatar from "./FramedAvatar.vue";

const props = withDefaults(
  defineProps<{
    profile: User;
    showWealth?: boolean;
  }>(),
  { showWealth: false },
);
const titlesQuery = useQuery(displayTitlesQuery);

const avatar = computed(
  () =>
    props.profile.portraitUrl || props.profile.photourl || "/static/images/default_avatar_boy.png",
);

const statusMessage = computed(() => {
  if (props.profile.lockState === 1 || props.profile.lockState === 2) return "该账号处于锁定状态";
  if (props.profile.lockState === 3) return "该账号处于全站禁言状态";
  if ((props.profile.stopPostBoardCount ?? 0) > 0) {
    return `该账号被 ${props.profile.stopPostBoardCount} 个版面禁言中`;
  }
  return "";
});
const titleBadges = computed(() => {
  const ids = new Set(props.profile.userTitleIds ?? []);
  return (titlesQuery.data.value ?? []).filter(
    (title) => ids.has(title.id) && title.id !== 18 && title.id !== 81,
  );
});

const fields = computed(() => {
  const profile = props.profile;
  const overview = props.showWealth
    ? ([
        ["性别", formatGender(profile.gender)],
        ["发帖数", profile.postCount ?? "—"],
        ["财富值", profile.wealth ?? "—"],
        ["粉丝数", profile.fanCount ?? "—"],
        ["威望", profile.prestige ?? "—"],
        ["风评", profile.popularity ?? "—"],
        ["注册时间", formatTime(profile.registerTime)],
        ["最后登录", formatTime(profile.lastLogOnTime)],
      ] as const)
    : ([
        ["性别", formatGender(profile.gender)],
        ["发帖数", profile.postCount ?? "—"],
        ["威望", profile.prestige ?? "—"],
        ["粉丝数", profile.fanCount ?? "—"],
        ["风评", profile.popularity ?? "—"],
        ["注册时间", formatDate(profile.registerTime)],
        ["最后登录", formatTime(profile.lastLogOnTime)],
      ] as const);
  return [
    ...overview,
    ...(profile.birthday ? ([["生日", profile.birthday.replace("9999-", "")]] as const) : []),
    ...(profile.displayTitle ? ([["用户组", profile.displayTitle]] as const) : []),
    ...(profile.emailAddress ? ([["邮箱", profile.emailAddress]] as const) : []),
    ...(profile.qq ? ([["QQ", profile.qq]] as const) : []),
    ["被删帖数", Math.max(0, -(profile.deleteCount ?? 0))],
  ] as const;
});

function formatGender(gender: number | undefined): string {
  if (gender === 1) return "男";
  if (gender === 0 || gender === 2) return "女";
  return "未设置";
}

function formatTime(value: string | undefined): string {
  if (!value) return "—";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD HH:mm") : value;
}

function formatDate(value: string | undefined): string {
  if (!value) return "—";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD") : value;
}
</script>

<template>
  <div class="user-profile-overview">
    <aside class="user-center-profile__avatar">
      <FramedAvatar
        :src="avatar"
        :alt="`${profile.name} 的头像`"
        :display-title-id="profile.displayTitleId"
        variant="profile"
      />
      <div
        v-if="titleBadges.length || profile.boardMasterTitles?.length"
        class="user-center-profile__badges"
      >
        <p v-for="titleBadge in titleBadges" :key="`title-${titleBadge.id}`">
          <span class="user-center-profile__badge-title">{{ titleBadge.name }}</span>
        </p>
        <p
          v-for="boardTitle in profile.boardMasterTitles ?? []"
          :key="`board-${boardTitle.boardId}`"
        >
          <RouterLink
            v-if="boardTitle.boardMasterLevel === 10"
            :to="{ name: 'board-list', hash: `#${boardTitle.boardName}` }"
          >
            {{ boardTitle.boardName }}
          </RouterLink>
          <RouterLink
            v-else
            :to="{ name: 'board', params: { boardId: String(boardTitle.boardId) } }"
          >
            {{ boardTitle.boardName }}
          </RouterLink>
          <span :class="{ 'user-center-profile__badge-title': boardTitle.boardMasterLevel === 10 }">
            {{ boardTitle.title }}
          </span>
        </p>
      </div>
    </aside>

    <section class="user-center-profile__details">
      <header class="user-center-profile__identity">
        <div class="user-center-profile__name">
          <strong>{{ profile.name }}</strong>
          <span>{{ profile.privilege }}</span>
        </div>
        <div class="user-center-profile__tools">
          <dl class="user-center-like-count">
            <dt>收到的赞</dt>
            <dd>{{ profile.receivedLikeCount ?? 0 }}</dd>
          </dl>
          <slot name="actions" />
        </div>
      </header>

      <p v-if="statusMessage" class="user-center-profile__status">{{ statusMessage }}</p>
      <p class="user-center-profile__introduction">
        {{ profile.introduction ?? "" }}
      </p>

      <dl class="user-center-profile__fields">
        <div v-for="[label, value] in fields" :key="label">
          <dt>{{ label }}</dt>
          <dd>{{ value }}</dd>
        </div>
      </dl>

      <section v-if="profile.signatureCode" class="user-center-signature">
        <h2>个性签名</h2>
        <div class="user-center-signature__content">
          <ContentRenderer
            type="ubb"
            :content="profile.signatureCode"
            :options="{ allowExternalImage: false }"
          />
        </div>
      </section>
    </section>
  </div>
</template>
