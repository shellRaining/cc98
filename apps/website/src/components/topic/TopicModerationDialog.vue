<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { BoardGroup, Topic } from "@cc98/api";
import { useModerateTopicMutation } from "../../api/mutations";
import type { AuthScope } from "../../api/queries";
import { normalizeApiError } from "../../lib/api-error";
import {
  flattenModerationBoards,
  MODERATION_DAY_OPTIONS,
  topicModerationNeedsDays,
  topicModerationNeedsTargetBoard,
  type TopicModerationAction,
  type TopicModerationRequest,
  validateTopicModerationRequest,
} from "../../lib/moderation";
import UiButton from "../ui/Button.vue";
import UiDialog from "../ui/Dialog.vue";

const props = defineProps<{
  open: boolean;
  topic: Topic;
  boardId: number;
  boards?: readonly BoardGroup[];
  authScope: AuthScope;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  completed: [action: TopicModerationAction];
}>();

interface ModerationActionDefinition {
  action: TopicModerationAction;
  label: string;
  danger?: boolean;
}

const activeAction = ref<TopicModerationAction>("lock");
const reason = ref("");
const days = ref<number>(7);
const targetBoardId = ref<number | undefined>();
const isBold = ref(false);
const isItalic = ref(false);
const color = ref("#ff0000");
const errorMessage = ref("");
const moderateTopic = useModerateTopicMutation();

const actions = computed<ModerationActionDefinition[]>(() => [
  {
    action: props.topic.state === 1 ? "unlock" : "lock",
    label: props.topic.state === 1 ? "解锁" : "锁定",
  },
  {
    action: props.topic.disableHot ? "enable-hot" : "disable-hot",
    label: props.topic.disableHot ? "允许热门" : "禁止热门",
  },
  { action: "delete", label: "删除", danger: true },
  { action: "move", label: "移动" },
  { action: "bump", label: "提升" },
  {
    action: props.topic.topState === 2 ? "remove-top" : "set-board-top",
    label: props.topic.topState === 2 ? "取消固顶" : "固顶",
  },
  {
    action: props.topic.topState === 4 ? "remove-top" : "set-global-top",
    label: props.topic.topState === 4 ? "取消全站固顶" : "全站固顶",
  },
  {
    action: props.topic.bestState === 1 ? "remove-best" : "set-best",
    label: props.topic.bestState === 1 ? "解除精华" : "加精",
  },
  { action: "highlight", label: "高亮" },
]);

const currentDefinition = computed(
  () => actions.value.find((item) => item.action === activeAction.value) ?? actions.value[0],
);
const availableBoards = computed(() =>
  flattenModerationBoards(props.boards).filter((board) => board.id !== props.boardId),
);
const needsDays = computed(() => topicModerationNeedsDays(activeAction.value));
const needsTargetBoard = computed(() => topicModerationNeedsTargetBoard(activeAction.value));

function resetForm() {
  activeAction.value = actions.value[0]?.action ?? "lock";
  reason.value = "";
  days.value = 7;
  targetBoardId.value = availableBoards.value[0]?.id;
  isBold.value = false;
  isItalic.value = false;
  color.value = "#ff0000";
  errorMessage.value = "";
}

watch(
  () => props.open,
  (open) => {
    if (open) resetForm();
  },
);

watch(activeAction, () => {
  errorMessage.value = "";
  if (needsTargetBoard.value && targetBoardId.value == null) {
    targetBoardId.value = availableBoards.value[0]?.id;
  }
});

function selectAction(action: TopicModerationAction) {
  activeAction.value = action;
}

async function submit() {
  if (moderateTopic.isPending.value) return;
  const request: TopicModerationRequest = {
    action: activeAction.value,
    topicId: props.topic.id ?? 0,
    reason: reason.value,
    ...(needsDays.value ? { days: days.value } : {}),
    ...(needsTargetBoard.value ? { targetBoardId: targetBoardId.value } : {}),
    ...(activeAction.value === "highlight"
      ? { isBold: isBold.value, isItalic: isItalic.value, color: color.value }
      : {}),
  };
  const validationError = validateTopicModerationRequest(request);
  if (validationError) {
    errorMessage.value = validationError;
    return;
  }

  errorMessage.value = "";
  try {
    await moderateTopic.mutateAsync({
      request,
      boardId: props.boardId,
      authScope: props.authScope,
    });
    emit("update:open", false);
    emit("completed", request.action);
  } catch (error) {
    errorMessage.value = normalizeApiError(error, {
      forbiddenMessage: "你没有管理该主题的权限",
    }).message;
  }
}
</script>

<template>
  <UiDialog
    :open="open"
    title="帖子管理"
    description="选择主题操作，并填写对应参数与版务理由。"
    width-class="w-[min(50rem,calc(100vw-2rem))]"
    :pending="moderateTopic.isPending.value"
    :confirm-label="currentDefinition?.danger ? '确认删除' : '确认'"
    :confirm-variant="currentDefinition?.danger ? 'danger' : 'primary'"
    @update:open="emit('update:open', $event)"
    @confirm="submit"
  >
    <nav class="topic-moderation-tabs" aria-label="主题管理操作">
      <button
        v-for="item in actions"
        :key="`${item.label}-${item.action}`"
        type="button"
        :class="{ 'is-active': item.action === activeAction, 'is-danger': item.danger }"
        @click="selectAction(item.action)"
      >
        {{ item.label }}
      </button>
    </nav>

    <form class="topic-moderation-form" @submit.prevent="submit">
      <label v-if="needsDays">
        <span>天数</span>
        <select v-model.number="days" :disabled="moderateTopic.isPending.value">
          <option v-for="option in MODERATION_DAY_OPTIONS" :key="option" :value="option">
            {{ option }}{{ option === 10000 ? "（作为永久使用）" : "" }}
          </option>
        </select>
      </label>

      <label v-if="needsTargetBoard">
        <span>目标版面</span>
        <select v-model.number="targetBoardId" :disabled="moderateTopic.isPending.value">
          <option v-if="availableBoards.length === 0" :value="undefined">暂无可选版面</option>
          <option v-for="item in availableBoards" :key="item.id" :value="item.id">
            {{ item.name ?? `版面 ${item.id}` }}
          </option>
        </select>
      </label>

      <fieldset v-if="activeAction === 'highlight'" class="topic-moderation-highlight">
        <legend>文字样式</legend>
        <label><input v-model="isBold" type="checkbox" /> 加粗</label>
        <label><input v-model="isItalic" type="checkbox" /> 斜体</label>
        <label class="topic-moderation-color">
          <span>颜色</span>
          <input v-model="color" type="color" />
          <input v-model.trim="color" type="text" maxlength="7" />
        </label>
      </fieldset>

      <label>
        <span>理由</span>
        <input
          v-model="reason"
          type="text"
          maxlength="200"
          autocomplete="off"
          :disabled="moderateTopic.isPending.value"
          placeholder="请输入本次操作理由"
        />
      </label>
      <p v-if="currentDefinition?.danger" class="topic-moderation-warning">
        删除后主题将无法在版面中继续访问，请确认操作对象与理由无误。
      </p>
      <p v-if="errorMessage" class="topic-moderation-error" role="alert">{{ errorMessage }}</p>
    </form>
  </UiDialog>
</template>
