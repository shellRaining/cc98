<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useBatchModerateTopicsMutation } from "../../api/mutations";
import { normalizeApiError } from "../../lib/api-error";
import {
  type BatchTopicModerationAction,
  type BatchTopicModerationRequest,
  validateBatchTopicModerationRequest,
} from "../../lib/moderation";
import UiDialog from "../ui/Dialog.vue";

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
