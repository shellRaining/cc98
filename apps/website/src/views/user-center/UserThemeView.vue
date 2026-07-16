<script setup lang="ts">
import type { ThemeSetting } from "@cc98/api";
import { useQuery } from "@tanstack/vue-query";
import { computed, reactive, ref, watch } from "vue";
import { currentUserQuery } from "../../api/queries";
import PageState from "../../components/PageState.vue";
import { normalizeApiError } from "../../lib/api-error";
import {
  ALL_SKINS,
  IMPLEMENTED_SKINS,
  isPairedSkin,
  type SkinId,
  type ThemeMode,
} from "../../stores/skins";
import { useThemeStore } from "../../stores/theme";

const theme = useThemeStore();
const meQuery = useQuery(currentUserQuery);
const skinMessage = ref("");
const settingMessage = ref("");
const pendingSkin = ref<SkinId | null>(null);
const pendingMode = ref<ThemeMode | null>(null);
const pendingSetting = ref(false);
let skinMessageTimer: ReturnType<typeof setTimeout> | undefined;
let settingMessageTimer: ReturnType<typeof setTimeout> | undefined;

const form = reactive({
  enableDayNightSwitch: false,
  syncWithBrowserDayNightMode: true,
  dayStartTime: "07:00",
  nightStartTime: "19:00",
});

const currentSkin = computed(() => ALL_SKINS.find((item) => item.id === theme.skin));
const browserModeSupported =
  typeof window !== "undefined" && typeof window.matchMedia === "function";

function normalizeTime(value: string | undefined, fallback: string): string {
  const match = /^(\d{2}):(\d{2})/.exec(value ?? "");
  return match ? `${match[1]}:${match[2]}` : fallback;
}

function fillSetting(setting: ThemeSetting | null | undefined) {
  form.enableDayNightSwitch = setting?.enableDayNightSwitch ?? false;
  form.syncWithBrowserDayNightMode = setting?.syncWithBrowserDayNightMode ?? true;
  form.dayStartTime = normalizeTime(setting?.dayStartTime, "07:00");
  form.nightStartTime = normalizeTime(setting?.nightStartTime, "19:00");
}

watch(
  () => meQuery.data.value,
  (me) => {
    if (!me) return;
    theme.syncFromServer(me);
    fillSetting(me.themeSetting);
  },
  { immediate: true },
);

function showSkinMessage(message: string) {
  skinMessage.value = message;
  if (skinMessageTimer) clearTimeout(skinMessageTimer);
  skinMessageTimer = setTimeout(() => {
    skinMessage.value = "";
  }, 3000);
}

function showSettingMessage(message: string) {
  settingMessage.value = message;
  if (settingMessageTimer) clearTimeout(settingMessageTimer);
  settingMessageTimer = setTimeout(() => {
    settingMessage.value = "";
  }, 3000);
}

function errorMessage(error: unknown): string {
  const normalized = normalizeApiError(error);
  return normalized.kind === "unknown" ? "网络请求失败，请稍后重试" : normalized.message;
}

function previewStyle(item: (typeof ALL_SKINS)[number]) {
  return {
    backgroundColor: item.previewColor,
    backgroundImage: item.previewImage ? `url(${item.previewImage})` : undefined,
  };
}

async function chooseSkin(skin: SkinId) {
  if (!IMPLEMENTED_SKINS.has(skin) || skin === theme.skin || pendingSkin.value) return;
  pendingSkin.value = skin;
  skinMessage.value = "";
  try {
    await theme.setSkin(skin);
    showSkinMessage(`已切换到${ALL_SKINS.find((item) => item.id === skin)?.name ?? "所选皮肤"}`);
  } catch (error) {
    showSkinMessage(`切换失败：${errorMessage(error)}`);
  } finally {
    pendingSkin.value = null;
  }
}

async function chooseMode(mode: ThemeMode) {
  if (theme.isAutoMode || mode === theme.mode || pendingMode.value) return;
  pendingMode.value = mode;
  skinMessage.value = "";
  try {
    await theme.setMode(mode);
    showSkinMessage(mode === "light" ? "已切换到亮色模式" : "已切换到深色模式");
  } catch (error) {
    showSkinMessage(`切换失败：${errorMessage(error)}`);
  } finally {
    pendingMode.value = null;
  }
}

async function submitSetting() {
  if (pendingSetting.value) return;
  pendingSetting.value = true;
  settingMessage.value = "";
  const setting: ThemeSetting = {
    enableDayNightSwitch: form.enableDayNightSwitch,
    syncWithBrowserDayNightMode: form.syncWithBrowserDayNightMode,
    dayStartTime: `${form.dayStartTime}:00`,
    nightStartTime: `${form.nightStartTime}:00`,
  };
  try {
    await theme.setDayNightSetting(setting);
    showSettingMessage("保存成功");
  } catch (error) {
    fillSetting(theme.dayNight);
    showSettingMessage(`保存失败：${errorMessage(error)}`);
  } finally {
    pendingSetting.value = false;
  }
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

  <div v-else class="user-theme">
    <section class="user-theme__intro">
      <h2>切换皮肤</h2>
      <p>
        当前皮肤：{{ currentSkin?.name ?? "系统默认" }}
        <span v-if="theme.skin === 'default'">（跟随站点默认，当前为夏季）</span>
      </p>
    </section>

    <form class="user-theme-settings" @submit.prevent="submitSetting">
      <fieldset class="user-theme-mode">
        <legend>显示模式</legend>
        <button
          type="button"
          :class="{ 'is-active': theme.effectiveMode === 'light' }"
          :disabled="theme.isAutoMode || pendingMode !== null"
          @click="chooseMode('light')"
        >
          亮色
        </button>
        <button
          type="button"
          :class="{ 'is-active': theme.effectiveMode === 'dark' }"
          :disabled="theme.isAutoMode || pendingMode !== null"
          @click="chooseMode('dark')"
        >
          深色
        </button>
        <span v-if="theme.isAutoMode">当前由昼夜规则自动切换</span>
      </fieldset>

      <label class="user-theme-check">
        <input v-model="form.enableDayNightSwitch" type="checkbox" />
        启用皮肤昼夜更换功能
      </label>
      <p class="user-theme-help">
        昼夜规则会切换页面明暗；带亮暗配对的皮肤还会同步使用对应的旧站主题编号。
      </p>

      <label class="user-theme-check">
        <input v-model="form.syncWithBrowserDayNightMode" type="checkbox" />
        自动同步浏览器的昼夜模式
        <span
          v-if="!browserModeSupported"
          class="user-theme-support-tip"
          title="当前浏览器不支持读取昼夜模式，将按固定时间切换。"
        >
          提示
        </span>
      </label>
      <p class="user-theme-help">浏览器不支持或关闭同步时，网站会按照下面设置的时间切换。</p>

      <div class="user-theme-time-row">
        <label for="day-start-input">白昼开始时刻</label>
        <input id="day-start-input" v-model="form.dayStartTime" type="time" required />
        <label for="night-start-input">夜间开始时刻</label>
        <input id="night-start-input" v-model="form.nightStartTime" type="time" required />
      </div>

      <div class="user-theme-submit">
        <button type="submit" :disabled="pendingSetting">保存设置</button>
        <span v-if="settingMessage" aria-live="polite">{{ settingMessage }}</span>
      </div>
    </form>

    <hr />

    <p v-if="skinMessage" class="user-theme__message" aria-live="polite">{{ skinMessage }}</p>
    <div class="user-theme-config">
      <button
        v-for="item in ALL_SKINS"
        :key="item.id"
        type="button"
        :style="previewStyle(item)"
        :class="{
          'is-current': item.id === theme.skin,
          'is-pending': pendingSkin === item.id,
          'is-unavailable': !IMPLEMENTED_SKINS.has(item.id),
        }"
        :disabled="
          item.id === theme.skin || !IMPLEMENTED_SKINS.has(item.id) || pendingSkin !== null
        "
        :aria-pressed="item.id === theme.skin"
        @click="chooseSkin(item.id)"
      >
        <span>{{ item.name }}</span>
        <small v-if="item.id === 'default'">跟随站点默认</small>
        <small v-else-if="!IMPLEMENTED_SKINS.has(item.id)">待迁移</small>
        <small v-else-if="isPairedSkin(item.id)">支持亮暗配对</small>
      </button>
    </div>
  </div>
</template>
