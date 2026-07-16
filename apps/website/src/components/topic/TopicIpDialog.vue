<script setup lang="ts">
import { computed } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { topicIpGroupsQuery, type AuthScope } from "../../api/queries";
import { normalizeApiError } from "../../lib/api-error";
import UiButton from "../ui/Button.vue";
import UiDialog from "../ui/Dialog.vue";

const props = defineProps<{
  open: boolean;
  topicId: number;
  authScope: AuthScope;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
}>();

const options = computed(() => topicIpGroupsQuery(props.topicId, props.authScope, props.open));
const query = useQuery(options);
const groups = computed(() => query.data.value ?? []);
const errorMessage = computed(() =>
  query.error.value ? normalizeApiError(query.error.value).message : "",
);
</script>

<template>
  <UiDialog
    :open="open"
    title="查看 IP"
    description="按 IP 分组查看该主题中的楼层，仅完整主题管理权限可用。"
    width-class="w-[min(50rem,calc(100vw-2rem))]"
    @update:open="emit('update:open', $event)"
  >
    <div class="topic-ip-body">
      <p v-if="query.isPending.value" class="topic-dialog-state">正在读取 IP 分组…</p>
      <div v-else-if="errorMessage" class="topic-dialog-state topic-dialog-state--error">
        <p>{{ errorMessage }}</p>
        <UiButton size="sm" variant="ghost" @click="query.refetch()">重试</UiButton>
      </div>
      <p v-else-if="groups.length === 0" class="topic-dialog-state">暂无可显示的 IP 数据。</p>
      <div v-else class="topic-ip-groups">
        <details v-for="(group, index) in groups" :key="`${group.ip}-${index}`">
          <summary>{{ group.ip || "未知 IP" }}　共 {{ group.posts?.length ?? 0 }} 条</summary>
          <ol>
            <li v-for="(post, postIndex) in group.posts ?? []" :key="`${post.floor}-${postIndex}`">
              <p>用户名：{{ post.userName || "匿名" }}　楼层：{{ post.floor ?? "?" }}</p>
              <p>{{ post.content || "（无内容）" }}</p>
            </li>
          </ol>
        </details>
      </div>
    </div>

    <template #footer>
      <UiButton size="sm" @click="emit('update:open', false)">确认</UiButton>
    </template>
  </UiDialog>
</template>
