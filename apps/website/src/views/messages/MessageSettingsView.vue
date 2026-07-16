<script setup lang="ts">
import { onBeforeUnmount, reactive, ref } from "vue";
import { useTitle } from "@vueuse/core";
import {
  loadMessageSettings,
  saveMessageSettings,
  type MessageSettings,
} from "../../lib/message-settings";

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
