<script setup lang="ts">
import { computed, ref, watch } from "vue";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/vue-query";
import { topicEventsQuery, type AuthScope } from "../../../api/queries";
import { normalizeApiError } from "../../../lib/api-error";
import UiButton from "../../../components/ui/Button.vue";
import UiDialog from "../../../components/ui/Dialog.vue";

const props = defineProps<{
  open: boolean;
  topicId: number;
  authScope: AuthScope;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
}>();

const PAGE_SIZE = 7;
const page = ref(1);
const options = computed(() =>
  topicEventsQuery(
    props.topicId,
    (page.value - 1) * PAGE_SIZE,
    PAGE_SIZE,
    props.authScope,
    props.open,
  ),
);
const query = useQuery(options);
const events = computed(() => query.data.value?.data ?? []);
const totalPages = computed(() =>
  Math.max(1, Math.ceil((query.data.value?.count ?? 0) / PAGE_SIZE)),
);
const errorMessage = computed(() =>
  query.error.value ? normalizeApiError(query.error.value).message : "",
);

watch(
  () => props.open,
  (open) => {
    if (open) page.value = 1;
  },
);

function formatTime(value: string) {
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD HH:mm:ss") : value;
}
</script>

<template>
  <UiDialog
    :open="open"
    title="管理记录"
    description="查看该主题的历史版务操作，每页显示 7 条。"
    width-class="w-[min(50rem,calc(100vw-2rem))]"
    @update:open="emit('update:open', $event)"
  >
    <div class="topic-history-body">
      <p v-if="query.isPending.value" class="topic-dialog-state">正在加载管理记录…</p>
      <div v-else-if="errorMessage" class="topic-dialog-state topic-dialog-state--error">
        <p>{{ errorMessage }}</p>
        <UiButton size="sm" variant="ghost" @click="query.refetch()">重试</UiButton>
      </div>
      <p v-else-if="events.length === 0" class="topic-dialog-state">暂无管理记录。</p>
      <ol v-else class="topic-history-list">
        <li v-for="event in events" :key="event.id">
          <div class="topic-history-list__main">
            <strong>{{ event.content }}</strong>
            <p>
              <span>对象：{{ event.targetUserName || "匿名" }}</span>
              <time :datetime="event.time">时间：{{ formatTime(event.time) }}</time>
            </p>
          </div>
          <div class="topic-history-list__operator">
            <span>操作人：{{ event.operatorUserName }}</span>
            <span>IP：{{ event.ip }}</span>
          </div>
        </li>
      </ol>
    </div>

    <template #footer>
      <div class="topic-dialog-footer">
        <nav v-if="totalPages > 1" class="topic-dialog-pagination" aria-label="管理记录分页">
          <UiButton
            size="sm"
            variant="ghost"
            :disabled="page <= 1 || query.isFetching.value"
            @click="page -= 1"
          >
            上一页
          </UiButton>
          <span>{{ page }} / {{ totalPages }}</span>
          <UiButton
            size="sm"
            variant="ghost"
            :disabled="page >= totalPages || query.isFetching.value"
            @click="page += 1"
          >
            下一页
          </UiButton>
        </nav>
        <UiButton size="sm" @click="emit('update:open', false)">确认</UiButton>
      </div>
    </template>
  </UiDialog>
</template>

<style scoped>
.topic-history-body {
  max-height: 20rem;
  margin-top: 1rem;
  overflow-y: auto;
  border-top: 1px solid var(--cc98-color-border);
}

.topic-dialog-state {
  margin: 0;
  padding: 3rem 1rem;
  color: var(--cc98-color-text-muted);
  text-align: center;
}

.topic-dialog-state--error {
  color: var(--cc98-color-error);
}

.topic-dialog-state--error p {
  margin: 0 0 1rem;
}

.topic-history-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.topic-history-list li {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 12rem;
  align-items: center;
  gap: 1.5rem;
  padding: 0.9rem 0.25rem;
  border-bottom: 1px solid var(--cc98-color-border);
}

.topic-history-list__main {
  min-width: 0;
}

.topic-history-list__main strong {
  display: block;
  overflow: hidden;
  color: var(--cc98-color-text);
  font-size: 0.875rem;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.topic-history-list__main p,
.topic-history-list__operator {
  margin: 0.35rem 0 0;
  color: var(--cc98-color-text-muted);
  font-size: 0.75rem;
}

.topic-history-list__main p {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
}

.topic-history-list__operator {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0.35rem;
}

.topic-history-list__operator span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.topic-dialog-footer {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.topic-dialog-pagination {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--cc98-color-text-muted);
  font-size: 0.75rem;
}
</style>
