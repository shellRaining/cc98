<script setup lang="ts">
import type { User } from "@cc98/api";
import dayjs from "dayjs";
import { computed } from "vue";
import ContentRenderer from "../rich-content/ContentRenderer.vue";

const props = withDefaults(
  defineProps<{
    profile: User;
    showWealth?: boolean;
  }>(),
  { showWealth: false },
);

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
        ["注册时间", formatTime(profile.registerTime)],
        ["最后登录", formatTime(profile.lastLogOnTime)],
      ] as const);
  return [
    ...overview,
    ...(profile.birthday ? ([["生日", profile.birthday.replace("9999-", "")]] as const) : []),
    ...(profile.displayTitle || profile.levelTitle
      ? ([["用户组", profile.displayTitle || profile.levelTitle || "—"]] as const)
      : []),
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

function replaceBrokenAvatar(event: Event) {
  const image = event.currentTarget as HTMLImageElement;
  image.src = "/static/images/default_avatar_boy.png";
}
</script>

<template>
  <div class="user-profile-overview">
    <aside class="user-center-profile__avatar">
      <img :src="avatar" :alt="`${profile.name} 的头像`" @error="replaceBrokenAvatar" />
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
      <p v-if="profile.introduction" class="user-center-profile__introduction">
        {{ profile.introduction }}
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
          <ContentRenderer type="ubb" :content="profile.signatureCode" />
        </div>
      </section>
    </section>
  </div>
</template>
