<script setup lang="ts">
import { useEventListener, useIntervalFn, useOnline } from "@vueuse/core";
import { useRegisterSW } from "virtual:pwa-register/vue";
import { computed, ref, shallowRef } from "vue";
import { createLogger, logErrorOnce } from "../lib/logger";
import {
  createServiceWorkerUpdateChecker,
  SERVICE_WORKER_UPDATE_INTERVAL,
  waitForWaitingServiceWorker,
} from "./pwa-update";
import UiDialog from "./ui/Dialog.vue";

const logger = createLogger("pwa");
const isOnline = useOnline();
const isUpdating = ref(false);
const updateError = ref("");
const preloadFailed = ref(false);
const registration = shallowRef<ServiceWorkerRegistration>();
const checkForUpdate = createServiceWorkerUpdateChecker(() => registration.value);
const { needRefresh, updateServiceWorker } = useRegisterSW({
  onRegisteredSW(_swUrl, nextRegistration) {
    registration.value = nextRegistration;
  },
  onRegisterError(error) {
    logErrorOnce(logger, error, "Service Worker 注册失败");
  },
});

const promptOpen = computed({
  get: () => needRefresh.value || preloadFailed.value,
  set: (open: boolean) => {
    if (open) return;
    needRefresh.value = false;
    preloadFailed.value = false;
    updateError.value = "";
  },
});
const promptTitle = computed(() => (preloadFailed.value ? "页面资源加载失败" : "发现新版本"));
const promptDescription = computed(() =>
  preloadFailed.value
    ? "目标页面所需资源未能加载，可能是网络波动或网站刚刚更新。重新加载当前页面后可以重试，请先保存尚未提交的内容。"
    : "新版本已经准备好，立即更新会重新加载当前页面。请先保存尚未提交的内容。",
);
const confirmLabel = computed(() => (preloadFailed.value ? "重新加载" : "立即更新"));

function requestUpdateCheck(force = false): void {
  if (!navigator.onLine) return;
  void checkForUpdate(force).catch((error: unknown) => {
    logErrorOnce(logger, error, "Service Worker 更新检查失败");
  });
}

useIntervalFn(() => requestUpdateCheck(), SERVICE_WORKER_UPDATE_INTERVAL);
useEventListener(window, "online", () => requestUpdateCheck());
useEventListener(document, "visibilitychange", () => {
  if (document.visibilityState === "visible") requestUpdateCheck();
});
useEventListener(window, "vite:preloadError", (event: Event) => {
  if (!navigator.onLine) return;
  event.preventDefault();
  preloadFailed.value = true;
  const error = (event as Event & { payload?: unknown }).payload ?? new Error("页面资源加载失败");
  logErrorOnce(logger, error, "页面资源加载失败");
  requestUpdateCheck(true);
});

async function update(): Promise<void> {
  isUpdating.value = true;
  updateError.value = "";
  try {
    const currentRegistration = registration.value;
    if (!currentRegistration?.waiting) {
      await checkForUpdate(true);
    }

    if (
      currentRegistration?.waiting ||
      (currentRegistration && (await waitForWaitingServiceWorker(currentRegistration)))
    ) {
      await updateServiceWorker();
    } else {
      window.location.reload();
    }
  } catch (error) {
    updateError.value = preloadFailed.value
      ? "重新加载失败，请稍后重试。"
      : "更新失败，请稍后重试。";
    logErrorOnce(logger, error, "Service Worker 更新失败");
  } finally {
    isUpdating.value = false;
  }
}
</script>

<template>
  <UiDialog
    v-model:open="promptOpen"
    :title="promptTitle"
    :description="promptDescription"
    cancel-label="稍后"
    :confirm-label="confirmLabel"
    :pending="isUpdating"
    @confirm="update"
  >
    <p v-if="updateError" class="pwa-update-error" role="alert">{{ updateError }}</p>
  </UiDialog>

  <aside v-if="!isOnline" class="pwa-status" role="status" aria-live="polite">
    <p>当前处于离线状态，页面将使用已经缓存的资源。</p>
  </aside>
</template>

<style scoped>
.pwa-status {
  position: fixed;
  right: var(--cc98-space-lg);
  bottom: var(--cc98-space-lg);
  z-index: 60;
  max-width: min(24rem, calc(100vw - 2 * var(--cc98-space-lg)));
  border: 1px solid var(--cc98-color-border);
  border-radius: var(--cc98-radius-md);
  background: var(--cc98-color-surface);
  padding: var(--cc98-space-md) var(--cc98-space-lg);
  color: var(--cc98-color-text);
  box-shadow: 0 8px 24px var(--cc98-color-shadow);
  font-size: 0.875rem;
}

.pwa-status p {
  margin: 0;
}

.pwa-update-error {
  margin: var(--cc98-space-md) 0 0;
  color: var(--cc98-color-error);
  font-size: 0.875rem;
}

@media (max-width: 40rem) {
  .pwa-status {
    right: var(--cc98-space-md);
    bottom: var(--cc98-space-md);
    left: var(--cc98-space-md);
    max-width: none;
  }
}
</style>
