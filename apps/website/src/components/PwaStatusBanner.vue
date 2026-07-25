<script setup lang="ts">
import { useOnline } from "@vueuse/core";
import { useRegisterSW } from "virtual:pwa-register/vue";
import { ref } from "vue";
import { createLogger, logErrorOnce } from "../lib/logger";
import UiDialog from "./ui/Dialog.vue";

const logger = createLogger("pwa");
const isOnline = useOnline();
const isUpdating = ref(false);
const updateError = ref("");
const { needRefresh, updateServiceWorker } = useRegisterSW({
  onRegisterError(error) {
    logErrorOnce(logger, error, "Service Worker 注册失败");
  },
});

async function update(): Promise<void> {
  isUpdating.value = true;
  updateError.value = "";
  try {
    await updateServiceWorker();
  } catch (error) {
    updateError.value = "更新失败，请稍后重试。";
    logErrorOnce(logger, error, "Service Worker 更新失败");
  } finally {
    isUpdating.value = false;
  }
}
</script>

<template>
  <UiDialog
    v-model:open="needRefresh"
    title="发现新版本"
    description="新版本已经准备好，立即更新会重新加载当前页面。请先保存尚未提交的内容。"
    cancel-label="稍后"
    confirm-label="立即更新"
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
  box-shadow: 0 8px 24px rgb(0 0 0 / 16%);
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
