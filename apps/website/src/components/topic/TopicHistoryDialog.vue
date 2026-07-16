<script setup lang="ts">
import { computed, ref, watch } from "vue";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/vue-query";
import { topicEventsQuery, type AuthScope } from "../../api/queries";
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
