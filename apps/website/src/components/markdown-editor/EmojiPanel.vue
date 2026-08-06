<script setup lang="ts">
import { listUbbEmotions, ubbEmotionDisplayName, type UbbEmotionDescriptor } from "@cc98/ubb";
import { computed, ref } from "vue";
import { useThemeStore } from "../../stores/theme";
import { emotionGroups, resolveEmotionDisplaySrc } from "./emoji-data";

const emit = defineEmits<{
  select: [emotion: UbbEmotionDescriptor];
}>();

const theme = useThemeStore();
const activeGroup = ref(emotionGroups[0]);
const emotions = computed(() => listUbbEmotions(activeGroup.value.family));
</script>

<template>
  <div class="emoji-panel" role="dialog" aria-label="选择表情">
    <div class="emoji-panel__tabs" role="tablist">
      <button
        v-for="group in emotionGroups"
        :key="group.family"
        type="button"
        class="emoji-panel__tab"
        :class="{ 'emoji-panel__tab--active': group.family === activeGroup.family }"
        role="tab"
        :aria-selected="group.family === activeGroup.family"
        @click="activeGroup = group"
      >
        {{ group.label }}
      </button>
    </div>
    <div class="emoji-panel__body">
      <div class="emoji-panel__grid" :style="{ '--emoji-cell': activeGroup.cell }">
        <button
          v-for="emotion in emotions"
          :key="emotion.src"
          type="button"
          class="emoji-panel__item"
          :title="ubbEmotionDisplayName(emotion)"
          @click="emit('select', emotion)"
        >
          <img
            :src="resolveEmotionDisplaySrc(emotion, theme.effectiveMode === 'dark')"
            :alt="ubbEmotionDisplayName(emotion)"
            loading="lazy"
          />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 小框浮层：不铺满编辑器宽度，右对齐到右上角的表情按钮，从按钮方向弹出。 */
.emoji-panel {
  position: absolute;
  /* 对齐编辑器 shell 顶部 1px 边框 + topBar 高度 2.75rem */
  top: calc(2.75rem + 1px);
  right: 0.5rem;
  z-index: 20;
  width: min(22rem, calc(100% - 1rem));
  transform-origin: top right;
  animation: emoji-pop-in 160ms ease;
  display: flex;
  flex-direction: column;
  max-height: 18rem;
  border: 1px solid var(--cc98-color-border);
  border-radius: var(--cc98-radius-sm);
  background: var(--cc98-color-surface);
  box-shadow: var(--crepe-shadow-2);
}

@keyframes emoji-pop-in {
  from {
    opacity: 0;
    transform: translateY(-0.375rem) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.emoji-panel__tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  padding: 0.5rem;
  border-bottom: 1px solid var(--cc98-color-border);
}

.emoji-panel__tab {
  padding: 0.25rem 0.625rem;
  border: none;
  border-radius: var(--cc98-radius-sm);
  background: none;
  color: var(--cc98-color-text-muted);
  font-size: 0.8125rem;
  cursor: pointer;
}

.emoji-panel__tab:hover {
  background: var(--cc98-color-surface-subtle);
  color: var(--cc98-color-text);
}

/* 亮色下 primary-soft 与 primary 同色，激活态用 on-primary 白字保证对比度，hover 时保持。 */
.emoji-panel__tab--active,
.emoji-panel__tab--active:hover {
  background: var(--cc98-color-primary-soft);
  color: var(--cc98-color-on-primary);
}

.emoji-panel__body {
  overflow-y: auto;
  padding: 0.625rem;
}

/* 格子尺寸沿用原 UBB 编辑器的习惯：AC 娘与 CC98/雀魂大图，麻将脸小图，其余适中。 */
.emoji-panel__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(var(--emoji-cell), 1fr));
  gap: 0.375rem;
}

.emoji-panel__item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--emoji-cell);
  height: var(--emoji-cell);
  padding: 0.25rem;
  border: 1px solid transparent;
  border-radius: var(--cc98-radius-sm);
  background: none;
  cursor: pointer;
}

.emoji-panel__item:hover {
  background: var(--cc98-color-surface-subtle);
  border-color: var(--cc98-color-border);
}

.emoji-panel__item img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
</style>
