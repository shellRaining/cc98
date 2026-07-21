<script setup lang="ts">
import type { User } from "@cc98/api";
import { useQuery } from "@tanstack/vue-query";
import dayjs from "dayjs";
import { computed } from "vue";
import { displayTitlesQuery } from "../../api/queries";
import ContentRenderer from "../rich-content/ContentRenderer.vue";
import FramedAvatar from "./FramedAvatar.vue";
import { resolveAvatarUrl } from "./avatar";

const props = withDefaults(
  defineProps<{
    profile: User;
    showWealth?: boolean;
  }>(),
  { showWealth: false },
);
const titlesQuery = useQuery(displayTitlesQuery);

const avatar = computed(() => resolveAvatarUrl(props.profile.portraitUrl, props.profile.photourl));

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

<style scoped>
.user-profile-overview {
  display: contents;
}

.user-center-profile__avatar {
  position: relative;
}

.user-center-profile__badges {
  width: 100%;
  margin-top: 2rem;
  padding-left: 1rem;
  font-size: 0.875rem;
}

.user-center-profile__badges p {
  display: flex;
  width: 100%;
  margin: 0.5rem 0 0;
}

.user-center-profile__badges a,
.user-center-profile__badges a:visited {
  min-width: 0;
  width: 60%;
  color: #35a7ff;
  overflow-wrap: anywhere;
}

.user-center-profile__badges span {
  min-width: 0;
  width: 40%;
  overflow-wrap: anywhere;
}

.user-center-profile__badge-title {
  color: #f00;
}

.user-center-profile__details {
  min-width: 0;
  padding: 0 2rem;
}

.user-center-profile__identity {
  display: flex;
  min-height: 5rem;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.user-center-profile__name {
  display: flex;
  min-width: 0;
  flex: 1 1 12rem;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 2rem;
}

.user-center-profile__identity strong {
  min-width: 0;
  font-size: 1.125rem;
  font-weight: 400;
  overflow-wrap: anywhere;
}

.user-center-profile__identity span {
  color: var(--cc98-color-text-muted);
  font-size: 0.75rem;
}

.user-center-profile__tools {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
}

.user-center-profile__status {
  margin: 0.75rem 0 0;
  color: var(--cc98-color-accent);
  font-size: 0.75rem;
}

.user-center-like-count {
  display: flex;
  margin: 0;
  font-size: 0.9rem;
}

.user-center-like-count dt,
.user-center-like-count dd {
  min-width: 5rem;
  margin: 0;
  padding: 0.3rem 0.5rem;
  border: 1px solid var(--cc98-color-border);
  text-align: center;
}

.user-center-like-count dt {
  background: var(--cc98-color-surface-subtle);
  color: var(--cc98-color-text-muted);
}

.user-center-like-count dd {
  border-left: 0;
  color: var(--cc98-color-primary);
}

.user-center-profile__introduction {
  min-height: 1rem;
  margin: 1rem 0 1rem 2rem;
  color: var(--cc98-color-text-muted);
  font-size: 0.75rem;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.user-center-profile__fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 0;
}

.user-center-profile__fields > div {
  display: grid;
  grid-template-columns: 5rem minmax(0, 1fr);
  min-width: 0;
  margin-bottom: 0.85rem;
}

.user-center-profile__fields dt,
.user-center-profile__fields dd {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
}

.user-center-profile__fields dt {
  color: var(--cc98-color-text);
}

.user-center-profile__fields dd {
  color: var(--cc98-color-text-muted);
}

.user-center-signature {
  max-width: 36.25rem;
  margin-top: 0.25rem;
}

.user-center-signature h2 {
  margin: 0 0 1rem;
  font-size: 0.88rem;
  font-weight: 400;
}

.user-center-signature__content {
  min-width: 0;
  overflow: hidden;
  padding: 1rem;
  border: 1px solid var(--cc98-color-border);
  font-size: 0.75rem;
}
</style>
