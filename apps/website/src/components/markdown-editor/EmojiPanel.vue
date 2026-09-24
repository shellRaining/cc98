<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useThemeStore } from "../../stores/theme";
import {
  emotionGroups,
  mahjongSubgroups,
  resolveEmotionDisplaySrc,
  type EditorEmotion,
} from "./emoji-data";

const props = defineProps<{ open: boolean }>();

const emit = defineEmits<{
  select: [emotion: EditorEmotion];
}>();

const theme = useThemeStore();
const activeKey = ref(emotionGroups[0]?.key ?? "");

watch(
  () => props.open,
  (open) => {
    if (open) activeKey.value = emotionGroups[0]?.key ?? "";
  },
);

const activeGroup = computed(
  () => emotionGroups.find((group) => group.key === activeKey.value) ?? emotionGroups[0],
);

/** 与面板展示一致：AC 娘在暗色模式使用 ac-dark 资源。 */
function displaySrc(emotion: EditorEmotion): string {
  return resolveEmotionDisplaySrc(emotion, theme.effectiveMode === "dark");
}

function select(emotion: EditorEmotion) {
  emit("select", emotion);
}
</script>

<template>
  <div v-if="open" class="emoji-panel" role="dialog" aria-label="选择表情">
    <div class="emoji-panel__tabs" role="tablist">
      <button
        v-for="group in emotionGroups"
        :key="group.key"
        type="button"
        class="emoji-panel__tab"
        :class="{ 'emoji-panel__tab--active': group.key === activeKey }"
        role="tab"
        :aria-selected="group.key === activeKey"
        @click="activeKey = group.key"
      >
        {{ group.label }}
      </button>
    </div>
    <div class="emoji-panel__body">
      <template v-if="activeGroup">
        <template v-if="activeGroup.key === 'mahjong'">
          <section
            v-for="subgroup in mahjongSubgroups"
            :key="subgroup.label"
            class="emoji-panel__subgroup"
          >
            <h3 class="emoji-panel__subgroup-title">{{ subgroup.label }}</h3>
            <div class="emoji-panel__grid emoji-panel__grid--mahjong">
              <button
                v-for="emotion in subgroup.emotions"
                :key="emotion.src"
                type="button"
                class="emoji-panel__item"
                :title="emotion.alt"
                @click="select(emotion)"
              >
                <img :src="displaySrc(emotion)" :alt="emotion.alt" loading="lazy" />
              </button>
            </div>
          </section>
        </template>
        <div v-else class="emoji-panel__grid" :class="`emoji-panel__grid--${activeGroup.key}`">
          <button
            v-for="emotion in activeGroup.emotions"
            :key="emotion.src"
            type="button"
            class="emoji-panel__item"
            :title="emotion.alt"
            @click="select(emotion)"
          >
            <img :src="displaySrc(emotion)" :alt="emotion.alt" loading="lazy" />
          </button>
        </div>
      </template>
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

.emoji-panel__subgroup-title {
  margin: 0.375rem 0 0.375rem;
  color: var(--cc98-color-text-caption);
  font-size: 0.75rem;
  font-weight: 500;
}

/* 网格尺寸沿用原 UBB 编辑器的习惯：AC 娘与 CC98/雀魂大图，麻将脸小图，其余适中。 */
.emoji-panel__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(3rem, 1fr));
  gap: 0.375rem;
}

.emoji-panel__grid--ac {
  grid-template-columns: repeat(auto-fill, minmax(4.75rem, 1fr));
}

.emoji-panel__grid--cc98,
.emoji-panel__grid--ms {
  grid-template-columns: repeat(auto-fill, minmax(4rem, 1fr));
}

.emoji-panel__grid--mahjong {
  grid-template-columns: repeat(auto-fill, minmax(2.5rem, 1fr));
}

.emoji-panel__item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  padding: 0.25rem;
  border: 1px solid transparent;
  border-radius: var(--cc98-radius-sm);
  background: none;
  cursor: pointer;
}

.emoji-panel__grid--ac .emoji-panel__item {
  width: 4.75rem;
  height: 4.125rem;
}

.emoji-panel__grid--cc98 .emoji-panel__item,
.emoji-panel__grid--ms .emoji-panel__item {
  width: 4rem;
  height: 4rem;
}

.emoji-panel__grid--mahjong .emoji-panel__item {
  width: 2.5rem;
  height: 2.5rem;
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
