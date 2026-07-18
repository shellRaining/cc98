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

<style scoped>
.user-theme h2 {
  margin: 0;
  font-size: 1rem;
  font-weight: 400;
}

.user-theme__intro {
  margin-bottom: 1.5rem;
}

.user-theme__intro p {
  margin: 0.65rem 0 0;
  color: var(--cc98-color-text-muted);
}

.user-theme-settings {
  color: var(--cc98-color-text);
}

.user-theme-settings fieldset {
  padding: 0;
  border: 0;
  margin: 0 0 1.25rem;
}

.user-theme-mode {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.user-theme-mode legend {
  float: left;
  width: 8rem;
}

.user-theme-mode button,
.user-theme-submit button {
  min-width: 5rem;
  height: 1.875rem;
  padding: 0 0.75rem;
  border: 1px solid var(--cc98-color-border);
  border-radius: 0.2rem;
  background: var(--cc98-color-surface-subtle);
  color: var(--cc98-color-text);
  font: inherit;
  cursor: pointer;
}

.user-theme-mode button.is-active,
.user-theme-submit button {
  border-color: var(--cc98-color-primary);
  background: var(--cc98-color-primary);
  color: #fff;
}

.user-theme-mode button:disabled {
  cursor: default;
  opacity: 0.55;
}

.user-theme-submit button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.user-theme-mode > span {
  margin-left: 0.5rem;
  color: var(--cc98-color-text-muted);
  font-size: 0.75rem;
}

.user-theme-check {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.user-theme-check input {
  margin: 0;
}

.user-theme-support-tip {
  margin-left: 0.25rem;
  color: var(--cc98-color-primary);
  cursor: help;
}

.user-theme-help {
  margin: 0.35rem 0 1.25rem 1.25rem;
  color: var(--cc98-color-text-muted);
  font-size: 0.75rem;
}

.user-theme-time-row {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.user-theme-time-row label + input {
  margin-right: 1rem;
}

.user-theme-time-row input {
  height: 1.875rem;
  padding: 0 0.4rem;
  border: 1px solid var(--cc98-color-border);
  background: var(--cc98-color-surface);
  color: var(--cc98-color-text);
  font: inherit;
}

.user-theme-submit {
  display: flex;
  min-height: 1.875rem;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1.25rem;
}

.user-theme-submit span,
.user-theme__message {
  color: var(--cc98-color-accent);
}

.user-theme hr {
  height: 0;
  margin: 2rem 0 1rem;
  border: 0;
  border-top: 1px solid var(--cc98-color-border);
}

.user-theme__message {
  min-height: 1.4rem;
  margin: 0 1rem 0.5rem;
}

.user-theme-config {
  display: grid;
  grid-template-columns: repeat(3, 14rem);
  justify-content: space-evenly;
  gap: 1.5rem 0.75rem;
}

.user-theme-config > button {
  position: relative;
  display: flex;
  width: 14rem;
  height: 6rem;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 0.5rem;
  border: 2px solid transparent;
  border-radius: 3px;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  box-shadow: inset 0 0 0 999px rgb(0 0 0 / 0.12);
  color: #fff;
  font: inherit;
  text-shadow: 0 1px 3px rgb(0 0 0 / 0.8);
  cursor: pointer;
  transition:
    border-color 120ms ease,
    filter 120ms ease,
    box-shadow 120ms ease;
}

.user-theme-config > button:hover:not(:disabled),
.user-theme-config > button:focus-visible {
  border-color: var(--cc98-color-primary);
  box-shadow: inset 0 0 0 999px rgb(0 0 0 / 0.4);
}

.user-theme-config > button.is-current {
  border-color: var(--cc98-color-primary);
  box-shadow:
    inset 0 0 0 999px rgb(0 0 0 / 0.3),
    0 0 0 1px var(--cc98-color-primary);
}

.user-theme-config > button.is-unavailable {
  filter: grayscale(0.65);
  cursor: not-allowed;
  opacity: 0.72;
}

.user-theme-config > button.is-pending {
  cursor: wait;
}

.user-theme-config span {
  font-size: 1.25rem;
  line-height: 1.4;
}

.user-theme-config small {
  font-size: 0.75rem;
  font-weight: 400;
}

@media (max-width: 1180px) {
  .user-theme-config {
    grid-template-columns: repeat(3, 13rem);
  }

  .user-theme-config > button {
    width: 13rem;
  }
}

@media (max-width: 1000px) {
  .user-theme-config {
    grid-template-columns: repeat(2, 14rem);
  }
}
</style>
