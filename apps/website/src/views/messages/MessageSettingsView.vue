<script setup lang="ts">
import { onBeforeUnmount, reactive, ref } from "vue";
import { useTitle } from "@vueuse/core";
import {
  loadMessageSettings,
  saveMessageSettings,
  type MessageSettings,
} from "../../stores/message-settings";

const rows: Array<{ key: keyof MessageSettings; label: string }> = [
  { key: "response", label: "是否显示回复通知" },
  { key: "attme", label: "是否显示@通知" },
  { key: "system", label: "是否显示系统通知" },
  { key: "message", label: "是否显示私信通知" },
  { key: "post", label: "回帖是否跳至最新回复" },
];
const settings = reactive(loadMessageSettings());
const saved = ref(false);
let savedTimer: ReturnType<typeof setTimeout> | undefined;

useTitle("消息设置 - CC98 论坛");
saveMessageSettings({ ...settings });

function save() {
  saveMessageSettings({ ...settings });
  saved.value = true;
  if (savedTimer) clearTimeout(savedTimer);
  savedTimer = setTimeout(() => {
    saved.value = false;
  }, 2000);
}

onBeforeUnmount(() => {
  if (savedTimer) clearTimeout(savedTimer);
});
</script>

<template>
  <form class="message-setting" @submit.prevent="save">
    <div
      v-for="row in rows"
      :key="row.key"
      class="message-setting__row"
      role="radiogroup"
      :aria-label="row.label"
    >
      <div class="message-setting__row-title">{{ row.label }}</div>
      <label>
        <input v-model="settings[row.key]" type="radio" :name="row.key" value="是" />
        是
      </label>
      <label>
        <input v-model="settings[row.key]" type="radio" :name="row.key" value="否" />
        否
      </label>
    </div>
    <button type="submit">保存消息设置</button>
    <p v-if="saved" class="message-setting__saved" role="status">保存成功</p>
  </form>
</template>

<style scoped>
.message-setting {
  position: relative;
  display: flex;
  height: 25rem;
  flex-direction: column;
  border: 1px solid var(--cc98-color-border);
  background: var(--cc98-color-surface);
}

.message-setting__row {
  display: flex;
  height: 2.5rem;
  flex: 0 0 2.5rem;
  align-items: center;
  padding: 0;
  border: 0;
  margin: 1.5rem 0 0 5rem;
  color: var(--cc98-color-text);
  font-size: 1rem;
}

.message-setting__row-title {
  width: 12rem;
  flex: 0 0 12rem;
}

.message-setting__row label {
  display: flex;
  align-items: center;
  margin-left: 1.5rem;
  cursor: pointer;
}

.message-setting__row input {
  margin: 0 0.2rem 0 0;
  accent-color: var(--cc98-color-primary);
}

.message-setting > button {
  width: 7rem;
  height: 2rem;
  margin: 2rem 0 0 9rem;
  border: 1px solid var(--cc98-color-border);
  border-radius: 3px;
  background: var(--cc98-color-surface-subtle);
  color: var(--cc98-color-text);
  cursor: pointer;
  font: inherit;
}

.message-setting > button:hover {
  border-color: var(--cc98-color-primary);
  background: var(--cc98-color-primary);
  color: #fff;
}

.message-setting__saved {
  position: absolute;
  top: 31%;
  left: 43%;
  margin: 0;
  padding: 0.75rem 1.5rem;
  border-radius: 3px;
  background: rgb(0 0 0 / 0.72);
  color: #fff;
  font-size: 0.875rem;
}
</style>
