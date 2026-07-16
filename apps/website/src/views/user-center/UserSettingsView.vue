<script setup lang="ts">
import type { ChangeUserRequest } from "@cc98/api";
import { useQuery } from "@tanstack/vue-query";
import { useObjectUrl } from "@vueuse/core";
import { computed, reactive, ref, watch } from "vue";
import { useUpdatePortraitMutation, useUpdateProfileMutation } from "../../api/mutations";
import { currentUserQuery, displayTitlesQuery } from "../../api/queries";
import PageState from "../../components/PageState.vue";
import { normalizeApiError } from "../../lib/api-error";
import { joinBirthday, splitBirthday, validateProfileSettings } from "../../lib/user-center";
import { useUserStore } from "../../stores/user";

const meQuery = useQuery(currentUserQuery);
const titlesQuery = useQuery(displayTitlesQuery);
const updateProfile = useUpdateProfileMutation();
const updatePortrait = useUpdatePortraitMutation();
const user = useUserStore();

const form = reactive({
  gender: 1,
  birthdayYear: 0,
  birthdayMonth: 0,
  birthdayDay: 0,
  displayTitleId: 0,
  qq: "",
  email: "",
  introduction: "",
  signature: "",
});
const profileMessage = ref("");
const avatarMessage = ref("");
const selectedAvatar = ref<File | null>(null);
const avatarPreview = useObjectUrl(selectedAvatar);

const years = Array.from({ length: new Date().getFullYear() - 1919 }, (_, index) => 1920 + index);
const months = Array.from({ length: 12 }, (_, index) => index + 1);
const days = Array.from({ length: 31 }, (_, index) => index + 1);
const currentAvatar = computed(
  () =>
    avatarPreview.value ||
    meQuery.data.value?.portraitUrl ||
    meQuery.data.value?.photourl ||
    "/static/images/default_avatar_boy.png",
);
const availableTitles = computed(() => {
  const ids = new Set(meQuery.data.value?.userTitleIds ?? []);
  return titlesQuery.data.value?.filter((title) => ids.has(title.id)) ?? [];
});

watch(
  () => meQuery.data.value,
  (me) => {
    if (!me) return;
    const birthday = splitBirthday(me.birthday);
    form.gender = me.gender ?? 1;
    form.birthdayYear = birthday.year;
    form.birthdayMonth = birthday.month;
    form.birthdayDay = birthday.day;
    form.displayTitleId = me.displayTitleId ?? 0;
    form.qq = me.qq ?? "";
    form.email = me.emailAddress ?? "";
    form.introduction = me.introduction ?? "";
    form.signature = me.signatureCode ?? "";
  },
  { immediate: true },
);

function chooseAvatar(event: Event) {
  const input = event.currentTarget as HTMLInputElement;
  const file = input.files?.[0] ?? null;
  avatarMessage.value = "";
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    avatarMessage.value = "请选择图片文件";
    input.value = "";
    return;
  }
  selectedAvatar.value = file;
  input.value = "";
}

async function submitAvatar() {
  if (!selectedAvatar.value) return;
  avatarMessage.value = "";
  try {
    const url = await updatePortrait.mutateAsync({ file: selectedAvatar.value });
    selectedAvatar.value = null;
    user.setUser(user.user ? { ...user.user, avatarUrl: url } : null);
    avatarMessage.value = "头像修改成功";
  } catch (error) {
    avatarMessage.value = normalizeApiError(error).message;
  }
}

async function useDefaultAvatar() {
  avatarMessage.value = "";
  try {
    const url = await updatePortrait.mutateAsync({ url: "/static/images/default_avatar_boy.png" });
    selectedAvatar.value = null;
    user.setUser(user.user ? { ...user.user, avatarUrl: url } : null);
    avatarMessage.value = "头像修改成功";
  } catch (error) {
    avatarMessage.value = normalizeApiError(error).message;
  }
}

async function submitProfile() {
  profileMessage.value = "";
  const birthday = {
    year: form.birthdayYear,
    month: form.birthdayMonth,
    day: form.birthdayDay,
  };
  const validation = validateProfileSettings({ email: form.email, qq: form.qq, birthday });
  if (validation) {
    profileMessage.value = validation;
    return;
  }
  const payload: ChangeUserRequest = {
    EmailAddress: form.email || null,
    Gender: form.gender,
    Introduction: form.introduction || null,
    QQ: form.qq || null,
    SignatureCode: form.signature || null,
    Birthday: joinBirthday(birthday),
    DisplayTitleId: form.displayTitleId,
  };
  try {
    await updateProfile.mutateAsync(payload);
    profileMessage.value = "修改成功";
  } catch (error) {
    profileMessage.value = normalizeApiError(error).message;
  }
}

function resetProfile() {
  const me = meQuery.data.value;
  if (!me) return;
  const birthday = splitBirthday(me.birthday);
  form.gender = me.gender ?? 1;
  form.birthdayYear = birthday.year;
  form.birthdayMonth = birthday.month;
  form.birthdayDay = birthday.day;
  form.displayTitleId = me.displayTitleId ?? 0;
  form.qq = me.qq ?? "";
  form.email = me.emailAddress ?? "";
  form.introduction = me.introduction ?? "";
  form.signature = me.signatureCode ?? "";
  profileMessage.value = "";
}
</script>

<template>
  <PageState v-if="meQuery.isPending.value" kind="loading" />
  <PageState
    v-else-if="meQuery.error.value"
    kind="error"
    :message="normalizeApiError(meQuery.error.value).message"
    show-retry
    @retry="meQuery.refetch()"
  />

  <form
    v-else-if="meQuery.data.value"
    class="user-settings"
    novalidate
    @submit.prevent="submitProfile"
  >
    <section class="user-settings__section">
      <h2>修改头像</h2>
      <div class="user-settings-avatar">
        <img :src="currentAvatar" alt="当前头像预览" />
        <div class="user-settings-avatar__actions">
          <button type="button" @click="useDefaultAvatar">选择论坛头像</button>
          <label>
            选择本地图片
            <input type="file" accept="image/*" @change="chooseAvatar" />
          </label>
          <button
            v-if="selectedAvatar"
            type="button"
            class="is-primary"
            :disabled="updatePortrait.isPending.value"
            @click="submitAvatar"
          >
            提交头像
          </button>
          <p v-if="selectedAvatar">已选择：{{ selectedAvatar.name }}</p>
          <p v-if="avatarMessage" class="user-settings__message">{{ avatarMessage }}</p>
        </div>
      </div>
    </section>

    <section class="user-settings__section">
      <h2>修改签名档</h2>
      <textarea v-model="form.signature" class="user-settings-signature" spellcheck="false" />
      <p class="user-settings__hint">
        注* 个性签名将在个人主页、发布文章和回复文章中显示，允许使用 UBB 代码。
      </p>
    </section>

    <section class="user-settings__section user-settings-fields">
      <h2>其他设置</h2>
      <label>
        <span>性别：</span>
        <select v-model.number="form.gender">
          <option :value="1">男</option>
          <option :value="0">女</option>
        </select>
      </label>
      <label class="user-settings-birthday">
        <span>生日：</span>
        <select v-model.number="form.birthdayYear">
          <option :value="0">未选择</option>
          <option :value="9999">保密</option>
          <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
        </select>
        <em>年</em>
        <select v-model.number="form.birthdayMonth" :disabled="form.birthdayYear === 0">
          <option :value="0">未选择</option>
          <option v-for="month in months" :key="month" :value="month">{{ month }}</option>
        </select>
        <em>月</em>
        <select v-model.number="form.birthdayDay" :disabled="form.birthdayYear === 0">
          <option :value="0">未选择</option>
          <option v-for="day in days" :key="day" :value="day">{{ day }}</option>
        </select>
        <em>日</em>
      </label>
      <label v-if="availableTitles.length">
        <span>头衔：</span>
        <select v-model.number="form.displayTitleId">
          <option :value="0">不显示</option>
          <option v-for="title in availableTitles" :key="title.id" :value="title.id">
            {{ title.name }}
          </option>
        </select>
      </label>
      <label>
        <span>QQ：</span>
        <input v-model="form.qq" type="text" maxlength="20" />
      </label>
      <label>
        <span>邮箱：</span>
        <input v-model="form.email" type="email" maxlength="150" />
      </label>
      <label class="user-settings-introduction">
        <span>个人简介：</span>
        <span>
          <textarea v-model="form.introduction" maxlength="100" />
          <small>*不超过 100 字</small>
        </span>
      </label>
    </section>

    <section class="user-settings-submit">
      <h2>提交修改</h2>
      <div>
        <button type="submit" class="is-primary" :disabled="updateProfile.isPending.value">
          提交
        </button>
        <button type="button" @click="resetProfile">重置</button>
      </div>
      <p v-if="profileMessage" class="user-settings__message">{{ profileMessage }}</p>
    </section>
  </form>
</template>
