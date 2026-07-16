<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";
import UiButton from "./ui/Button.vue";

type PageStateKind = "loading" | "empty" | "unauthorized" | "forbidden" | "not-found" | "error";

const props = withDefaults(
  defineProps<{
    kind: PageStateKind;
    title?: string;
    message?: string;
    showRetry?: boolean;
  }>(),
  {
    showRetry: false,
  },
);

const emit = defineEmits<{
  retry: [];
  login: [];
}>();

const defaults: Record<PageStateKind, { title: string; message: string }> = {
  loading: { title: "加载中", message: "正在获取内容…" },
  empty: { title: "暂无内容", message: "这里还没有数据。" },
  unauthorized: { title: "需要登录", message: "登录后即可继续浏览。" },
  forbidden: { title: "无权访问", message: "你没有权限查看该内容。" },
  "not-found": { title: "未找到", message: "内容不存在或已删除。" },
  error: { title: "加载失败", message: "请稍后重试。" },
};

const resolvedTitle = computed(() => props.title ?? defaults[props.kind].title);
const resolvedMessage = computed(() => props.message ?? defaults[props.kind].message);
</script>

<template>
  <div class="rounded border border-cc98-border bg-cc98-surface px-4 py-6 text-sm space-y-3">
    <h2 class="text-base font-semibold text-cc98-text">{{ resolvedTitle }}</h2>
    <p class="text-cc98-text-muted">{{ resolvedMessage }}</p>
    <div class="flex flex-wrap gap-3">
      <UiButton v-if="kind === 'unauthorized'" variant="text" type="button" @click="emit('login')">
        去登录
      </UiButton>
      <UiButton
        v-if="showRetry || kind === 'error'"
        variant="text"
        type="button"
        @click="emit('retry')"
      >
        重试
      </UiButton>
      <RouterLink v-if="kind === 'not-found' || kind === 'forbidden'" to="/" class="cc98-link">
        返回首页
      </RouterLink>
    </div>
  </div>
</template>
