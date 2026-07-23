<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { Post } from "@cc98/api";
import { useQuery } from "@tanstack/vue-query";
import {
  useModeratePostMutation,
  type PostModerationAction,
  type PostModerationRequest,
} from "../../../api/mutations";
import { postRewardDailyRecordQuery, type AuthScope } from "../../../api/queries";
import { normalizeApiError } from "../../../lib/api-error";
import UiDialog from "../../../components/ui/Dialog.vue";
import { validatePostModerationRequest } from "./post-moderation";

const props = defineProps<{
  open: boolean;
  post: Post;
  topicId: number;
  boardId: number;
  boardName?: string;
  authScope: AuthScope;
  fullManager?: boolean;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  completed: [action: PostModerationAction];
}>();

interface ActionDefinition {
  action: PostModerationAction;
  label: string;
  danger?: boolean;
}

const actions: ActionDefinition[] = [
  { action: "reward-wealth", label: "奖励财富值" },
  { action: "reward-prestige", label: "奖励威望" },
  { action: "deduct-wealth", label: "扣除财富值" },
  { action: "deduct-prestige", label: "扣除威望" },
  { action: "delete", label: "删除", danger: true },
  { action: "mute", label: "TP", danger: true },
  { action: "unmute", label: "解除 TP" },
];
const rewardReasons = ["好文章", "有用资源", "热心回复"];
const punishReasons = ["人身攻击", "违反版规", "恶意灌水"];

const action = ref<PostModerationAction>("reward-wealth");
const reason = ref("");
const value = ref<number>(1000);
const days = ref<number>(7);
const errorMessage = ref("");
const moderatePost = useModeratePostMutation();
const currentDefinition = computed(
  () => actions.find((item) => item.action === action.value) ?? actions[0],
);
const needsValue = computed(() =>
  ["reward-wealth", "reward-prestige", "deduct-wealth", "deduct-prestige"].includes(action.value),
);
const reasonSuggestions = computed(() =>
  action.value.startsWith("reward-") ? rewardReasons : punishReasons,
);
const rewardOptions = computed(() =>
  postRewardDailyRecordQuery(
    props.boardId,
    props.authScope,
    props.open && props.fullManager === true,
  ),
);
const rewardQuery = useQuery(rewardOptions);
const rewardSummary = computed(() => {
  const record = rewardQuery.data.value;
  const boardName = record?.boardName || props.boardName || `版面 ${props.boardId}`;
  const total = record?.rewardTotalValue ?? 0;
  const maximum = record?.rewardMaxValue ? String(record.rewardMaxValue) : "不限";
  return `今天在${boardName}已发放 ${total} 财富值，最多可发 ${maximum}，单次最多 1000。`;
});

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    action.value = "reward-wealth";
    reason.value = "";
    value.value = 1000;
    days.value = 7;
    errorMessage.value = "";
  },
);

watch(action, () => {
  reason.value = "";
  value.value = action.value.includes("wealth") ? 1000 : 1;
  errorMessage.value = "";
});

async function submit() {
  if (moderatePost.isPending.value) return;
  const request: PostModerationRequest = {
    action: action.value,
    postId: props.post.id ?? 0,
    boardId: props.boardId,
    userId: props.post.userId,
    reason: reason.value,
    ...(needsValue.value ? { value: value.value } : {}),
    ...(action.value === "mute" ? { days: days.value } : {}),
  };
  let validationError = validatePostModerationRequest(request);
  if (action.value === "reward-wealth" && value.value > 1000) {
    validationError = "单次奖励财富值不能超过 1000";
  }
  if (validationError) {
    errorMessage.value = validationError;
    return;
  }

  try {
    await moderatePost.mutateAsync({ request, topicId: props.topicId });
    emit("update:open", false);
    emit("completed", request.action);
  } catch (error) {
    errorMessage.value = normalizeApiError(error, {
      forbiddenMessage: "你没有管理该楼层的权限",
    }).message;
  }
}
</script>

<template>
  <UiDialog
    :open="open"
    title="发言管理"
    description="管理该楼层的奖励、惩罚、删除和版面 TP。"
    width-class="w-[min(50rem,calc(100vw-2rem))]"
    :pending="moderatePost.isPending.value"
    :confirm-label="currentDefinition?.danger ? '确认操作' : '确认'"
    :confirm-variant="currentDefinition?.danger ? 'danger' : 'primary'"
    @update:open="emit('update:open', $event)"
    @confirm="submit"
  >
    <nav class="topic-moderation-tabs post-moderation-tabs" aria-label="楼层管理操作">
      <button
        v-for="item in actions"
        :key="item.action"
        type="button"
        :class="{ 'is-active': item.action === action, 'is-danger': item.danger }"
        @click="action = item.action"
      >
        {{ item.label }}
      </button>
    </nav>

    <form class="topic-moderation-form" @submit.prevent="submit">
      <p v-if="action === 'reward-wealth'" class="post-moderation-summary">
        {{ rewardSummary }}
      </p>
      <label v-if="needsValue">
        <span>{{ action.includes("wealth") ? "财富值" : "威望" }}</span>
        <input v-model.number="value" type="number" min="1" step="1" />
      </label>
      <label v-if="action === 'mute'">
        <span>天数</span>
        <input v-model.number="days" type="number" min="1" step="1" />
      </label>
      <label v-if="action !== 'unmute'">
        <span>理由</span>
        <input v-model.trim="reason" type="text" list="post-moderation-reasons" maxlength="200" />
        <datalist id="post-moderation-reasons">
          <option v-for="item in reasonSuggestions" :key="item" :value="item" />
        </datalist>
      </label>
      <p v-else class="post-moderation-summary">
        将解除 {{ post.userName || "该用户" }} 在当前版面的 TP。
      </p>
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

.post-moderation-tabs {
  justify-content: flex-start;
}

.post-moderation-summary {
  margin: 0;
  padding: 0.65rem 0.8rem;
  border: 1px solid color-mix(in srgb, var(--cc98-color-primary) 35%, transparent);
  background: color-mix(in srgb, var(--cc98-color-primary) 8%, transparent);
  color: var(--cc98-color-text-muted);
  font-size: 0.8rem;
}

.topic-moderation-error {
  margin: 0;
  color: var(--cc98-color-error);
  font-size: 0.875rem;
}
</style>
