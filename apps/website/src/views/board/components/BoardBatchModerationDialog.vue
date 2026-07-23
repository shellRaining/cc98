<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  useBatchModerateTopicsMutation,
  type BatchTopicModerationAction,
  type BatchTopicModerationRequest,
} from "../../../api/mutations";
import { normalizeApiError } from "../../../lib/api-error";
import UiDialog from "../../../components/ui/Dialog.vue";
import { validateBatchTopicModerationRequest } from "./board-batch-moderation";

const props = defineProps<{ open: boolean; boardId: number; topicIds: number[] }>();
const emit = defineEmits<{
  "update:open": [value: boolean];
  completed: [];
}>();
const action = ref<BatchTopicModerationAction>("lock");
const reasonPreset = ref("重复发帖");
const customReason = ref("");
const days = ref(7);
const errorMessage = ref("");
const mutation = useBatchModerateTopicsMutation();
const reason = computed(() =>
  reasonPreset.value === "自定义" ? customReason.value : reasonPreset.value,
);

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    action.value = "lock";
    reasonPreset.value = "重复发帖";
    customReason.value = "";
    days.value = 7;
    errorMessage.value = "";
  },
);

async function submit() {
  const request: BatchTopicModerationRequest = {
    action: action.value,
    topicIds: props.topicIds,
    reason: reason.value,
    ...(action.value === "lock" ? { days: days.value } : {}),
  };
  const validationError = validateBatchTopicModerationRequest(request);
  if (validationError) return void (errorMessage.value = validationError);
  try {
    await mutation.mutateAsync({ request, boardId: props.boardId });
    emit("update:open", false);
    emit("completed");
  } catch (error) {
    errorMessage.value = normalizeApiError(error, {
      forbiddenMessage: "你没有批量管理该版面的权限",
    }).message;
  }
}
</script>

<template>
  <UiDialog
    :open="open"
    title="批量管理"
    :description="`已选择 ${topicIds.length} 个主题。`"
    width-class="w-[min(36rem,calc(100vw-2rem))]"
    :pending="mutation.isPending.value"
    :confirm-label="action === 'delete' ? '确认删除' : '确认锁沉'"
    :confirm-variant="action === 'delete' ? 'danger' : 'primary'"
    @update:open="emit('update:open', $event)"
    @confirm="submit"
  >
    <nav class="topic-moderation-tabs" aria-label="批量管理操作">
      <button type="button" :class="{ 'is-active': action === 'lock' }" @click="action = 'lock'">
        批量锁沉
      </button>
      <button
        type="button"
        class="is-danger"
        :class="{ 'is-active': action === 'delete' }"
        @click="action = 'delete'"
      >
        批量删除
      </button>
    </nav>
    <form class="topic-moderation-form" @submit.prevent="submit">
      <label v-if="action === 'lock'">
        <span>下沉天数</span>
        <select v-model.number="days">
          <option :value="7">7</option>
          <option :value="30">30</option>
          <option :value="98">98</option>
          <option :value="1000">1000</option>
        </select>
      </label>
      <label>
        <span>处理理由</span>
        <select v-model="reasonPreset">
          <option
            v-for="item in ['重复发帖', '管理要求', '已解决', '内容不符', '违反版规', '自定义']"
            :key="item"
          >
            {{ item }}
          </option>
        </select>
      </label>
      <label v-if="reasonPreset === '自定义'">
        <span>自定义理由</span><input v-model.trim="customReason" type="text" maxlength="200" />
      </label>
      <p v-if="errorMessage" class="topic-moderation-error" role="alert">{{ errorMessage }}</p>
    </form>
  </UiDialog>
</template>

<style scoped>
.topic-moderation-tabs {
  display: flex;
  align-items: stretch;
  justify-content: space-around;
  gap: 0.25rem;
  margin: 1rem 0;
  overflow-x: auto;
  border-bottom: 1px solid var(--cc98-color-border);
}

.topic-moderation-tabs button {
  position: relative;
  min-width: max-content;
  padding: 0.7rem 0.65rem;
  border: 0;
  background: transparent;
  color: var(--cc98-color-text-muted);
  font: inherit;
  cursor: pointer;
}

.topic-moderation-tabs button:hover,
.topic-moderation-tabs button.is-active {
  color: var(--cc98-color-primary);
}

.topic-moderation-tabs button.is-active::after {
  position: absolute;
  right: 0.4rem;
  bottom: -1px;
  left: 0.4rem;
  height: 2px;
  background: var(--cc98-color-primary-fill);
  content: "";
}

.topic-moderation-tabs button.is-danger {
  color: var(--cc98-color-error);
}

.topic-moderation-tabs button.is-danger.is-active::after {
  background: var(--cc98-color-error);
}

.topic-moderation-form {
  display: grid;
  gap: 1rem;
  min-height: 10rem;
  padding: 0.5rem 0;
}

.topic-moderation-form > label {
  display: grid;
  grid-template-columns: 5rem minmax(0, 1fr);
  align-items: center;
  gap: 1rem;
  color: var(--cc98-color-text);
  font-size: 0.875rem;
}

.topic-moderation-form input[type="text"],
.topic-moderation-form input[type="number"],
.topic-moderation-form select {
  width: 100%;
  min-width: 0;
  height: 2.4rem;
  padding: 0 0.7rem;
  border: 1px solid var(--cc98-color-border);
  border-radius: 0.2rem;
  background: var(--cc98-color-surface);
  color: var(--cc98-color-text);
}

.topic-moderation-error {
  margin: 0;
  color: var(--cc98-color-error);
  font-size: 0.875rem;
}
</style>
