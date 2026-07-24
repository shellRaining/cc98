<script setup lang="ts">
import { useOnline } from "@vueuse/core";
import { useRegisterSW } from "virtual:pwa-register/vue";
import { computed } from "vue";
import { createLogger, logErrorOnce } from "../lib/logger";
import UiButton from "./ui/Button.vue";

const logger = createLogger("pwa");
const isOnline = useOnline();
const { needRefresh, updateServiceWorker } = useRegisterSW({
  onRegisterError(error) {
    logErrorOnce(logger, error, "Service Worker 注册失败");
  },
});

const visible = computed(() => needRefresh.value || !isOnline.value);

async function update(): Promise<void> {
  try {
    await updateServiceWorker();
  } catch (error) {
    logErrorOnce(logger, error, "Service Worker 更新失败");
  }
}
</script>

<template>
  <aside v-if="visible" class="pwa-status" role="status" aria-live="polite">
    <template v-if="needRefresh">
      <p>新版本已经准备好，刷新后即可使用。</p>
      <div class="pwa-actions">
        <UiButton size="sm" variant="ghost" @click="needRefresh = false">稍后</UiButton>
        <UiButton size="sm" @click="update">刷新</UiButton>
      </div>
    </template>
    <p v-else>当前处于离线状态，页面将使用已经缓存的资源。</p>
  </aside>
</template>

<style scoped>
.pwa-status {
  position: fixed;
  right: var(--cc98-space-lg);
  bottom: var(--cc98-space-lg);
  z-index: 60;
  display: flex;
  max-width: min(24rem, calc(100vw - 2 * var(--cc98-space-lg)));
  align-items: center;
  gap: var(--cc98-space-lg);
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

.pwa-actions {
  display: flex;
  flex: none;
  gap: var(--cc98-space-sm);
}

@media (max-width: 40rem) {
  .pwa-status {
    right: var(--cc98-space-md);
    bottom: var(--cc98-space-md);
    left: var(--cc98-space-md);
    max-width: none;
    justify-content: space-between;
  }
}
</style>
