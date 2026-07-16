<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useQuery } from "@tanstack/vue-query";
import dayjs from "dayjs";
import { useSubmitVoteMutation } from "../api/mutations";
import UiButton from "./ui/Button.vue";
import { topicVoteQuery } from "../api/queries";
import { normalizeApiError } from "../lib/api-error";
import { createVotePayload } from "../lib/interactions";
import type { AuthScope } from "../api/queries";

const props = defineProps<{
  topicId: number;
  authScope: AuthScope;
  enabled: boolean;
}>();

const voteOptions = computed(() => topicVoteQuery(props.topicId, props.authScope, props.enabled));
const { data: vote, error: voteError, isPending, refetch } = useQuery(voteOptions);
const submitVote = useSubmitVoteMutation();
const selected = ref<number[]>([]);
const submitError = ref("");
const voteItems = computed(() => vote.value?.voteItems ?? []);
const maxVoteCount = computed(() => Math.max(1, vote.value?.maxVoteCount ?? 1));
const hasVoted = computed(() => Boolean(vote.value?.myRecord));
const hideResults = computed(
  () => vote.value?.needVote && !hasVoted.value && vote.value?.isAvailable,
);

watch(
  () => vote.value?.myRecord?.items,
  (items) => {
    selected.value = items ? [...items] : [];
  },
  { immediate: true },
);

function optionDisabled(id: number): boolean {
  return (
    submitVote.isPending.value ||
    vote.value?.canVote !== true ||
    (!selected.value.includes(id) && selected.value.length >= maxVoteCount.value)
  );
}

function formatExpiredTime(value: string | undefined): string {
  if (!value) return "未提供";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD HH:mm") : value;
}

async function submit() {
  submitError.value = "";
  const result = createVotePayload(
    selected.value,
    voteItems.value.map((item) => item.id),
    maxVoteCount.value,
  );
  if (result.error || !result.payload) {
    submitError.value = result.error ?? "投票选项无效";
    return;
  }
  try {
    await submitVote.mutateAsync({
      topicId: props.topicId,
      authScope: props.authScope,
      payload: result.payload,
    });
  } catch (error) {
    submitError.value = normalizeApiError(error, {
      forbiddenMessage: "你已经投过票，或当前没有投票权限",
    }).message;
  }
}
</script>

<template>
  <section class="cc98-card p-4 space-y-3" aria-labelledby="topic-vote-title">
    <div class="flex items-center justify-between gap-3">
      <h2 id="topic-vote-title" class="text-lg font-semibold">主题投票</h2>
      <button v-if="voteError" type="button" class="cc98-link text-sm" @click="refetch()">
        重新加载
      </button>
    </div>
    <p v-if="isPending" class="text-sm text-cc98-text-muted">正在加载投票…</p>
    <p v-else-if="voteError" class="text-sm text-cc98-accent">
      {{ normalizeApiError(voteError).message }}
    </p>
    <p v-else-if="voteItems.length === 0" class="text-sm text-cc98-text-muted">
      该投票暂未提供可显示的选项。
    </p>
    <template v-else>
      <label
        v-for="item in voteItems"
        :key="item.id"
        class="flex items-center justify-between gap-3 rounded border border-cc98-border px-3 py-2 text-sm"
      >
        <span class="flex items-center gap-2">
          <input
            v-model="selected"
            type="checkbox"
            :value="item.id"
            :disabled="optionDisabled(item.id)"
          />
          {{ item.description }}
        </span>
        <span v-if="!hideResults" class="text-cc98-text-muted">{{ item.count }} 票</span>
      </label>
      <div class="text-sm text-cc98-text-muted">
        <p>每人最多选择 {{ maxVoteCount }} 项，已有 {{ vote?.voteUserCount ?? 0 }} 人参与。</p>
        <p>截止时间：{{ formatExpiredTime(vote?.expiredTime) }}</p>
        <p v-if="hasVoted">你已经投过票。</p>
        <p v-else-if="hideResults">完成投票后可查看结果。</p>
        <p v-else-if="vote?.isAvailable === false">投票已结束。</p>
      </div>
      <p v-if="submitError" class="text-sm text-cc98-accent">{{ submitError }}</p>
      <div v-if="vote?.canVote" class="flex gap-3">
        <UiButton
          type="button"
          size="sm"
          :disabled="selected.length === 0"
          :loading="submitVote.isPending.value"
          @click="submit"
        >
          {{ submitVote.isPending.value ? "提交中…" : "提交投票" }}
        </UiButton>
        <button
          type="button"
          class="cc98-link"
          :disabled="submitVote.isPending.value"
          @click="selected = []"
        >
          重置
        </button>
      </div>
    </template>
  </section>
</template>
