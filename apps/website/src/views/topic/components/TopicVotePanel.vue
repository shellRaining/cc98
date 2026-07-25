<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useQuery } from "@tanstack/vue-query";
import dayjs from "dayjs";
import { useSubmitVoteMutation } from "../../../api/mutations";
import UiButton from "../../../components/ui/Button.vue";
import { topicVoteQuery } from "../../../api/queries";
import { normalizeApiError } from "../../../lib/api-error";
import type { AuthScope } from "../../../api/queries";
import { calculateVotePercentage, createVotePayload } from "../topic-vote";

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
const participantCount = computed(() => Math.max(0, vote.value?.voteUserCount ?? 0));
const hasVoted = computed(() => Boolean(vote.value?.myRecord));
const hideResults = computed(
  () => vote.value?.needVote && !hasVoted.value && vote.value?.isAvailable,
);
const selectedDescriptions = computed(() => {
  const selectedIds = new Set(vote.value?.myRecord?.items ?? []);
  return voteItems.value.filter((item) => selectedIds.has(item.id)).map((item) => item.description);
});
const voteStatus = computed(() => {
  if (vote.value?.isAvailable === false) return { label: "已结束", tone: "muted" } as const;
  if (hasVoted.value) return { label: "已投票", tone: "success" } as const;
  if (vote.value?.canVote) return { label: "进行中", tone: "primary" } as const;
  return { label: "查看结果", tone: "muted" } as const;
});
const canSubmit = computed(
  () => selected.value.length > 0 && selected.value.length <= maxVoteCount.value,
);

const percentageFormatter = new Intl.NumberFormat("zh-CN", {
  maximumFractionDigits: 1,
});

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
  return parsed.isValid() ? parsed.format("YYYY-MM-DD HH:mm:ss") : value;
}

function itemPercentage(count: number): number {
  return calculateVotePercentage(count, participantCount.value);
}

function formatPercentage(count: number): string {
  return `${percentageFormatter.format(itemPercentage(count))}%`;
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
  <section class="topic-vote" aria-labelledby="topic-vote-title">
    <header class="topic-vote__header">
      <div class="topic-vote__heading">
        <span class="i-heroicons-chart-bar-square topic-vote__heading-icon" aria-hidden="true" />
        <div>
          <h2 id="topic-vote-title">主题投票</h2>
          <p>选择你认可的选项</p>
        </div>
      </div>
      <span
        v-if="vote && !voteError"
        class="topic-vote__status"
        :class="`topic-vote__status--${voteStatus.tone}`"
      >
        {{ voteStatus.label }}
      </span>
      <UiButton v-if="voteError" variant="text" type="button" size="sm" @click="refetch()">
        重新加载
      </UiButton>
    </header>

    <div v-if="isPending" class="topic-vote__loading" aria-live="polite">
      <span>正在加载投票…</span>
      <div v-for="index in 3" :key="index" class="topic-vote__skeleton" />
    </div>
    <div v-else-if="voteError" class="topic-vote__message topic-vote__message--error">
      <span class="i-heroicons-exclamation-circle" aria-hidden="true" />
      {{ normalizeApiError(voteError).message }}
    </div>
    <div v-else-if="voteItems.length === 0" class="topic-vote__message">
      该投票暂未提供可显示的选项。
    </div>
    <template v-else>
      <fieldset class="topic-vote__options">
        <legend class="sr-only">投票选项</legend>
        <label
          v-for="(item, index) in voteItems"
          :key="item.id"
          class="topic-vote__option"
          :class="[
            `topic-vote__option--tone-${index % 5}`,
            { 'topic-vote__option--selected': selected.includes(item.id) },
          ]"
        >
          <span class="topic-vote__option-row">
            <span class="topic-vote__option-label">
              <input
                v-model="selected"
                class="topic-vote__checkbox"
                type="checkbox"
                :value="item.id"
                :disabled="optionDisabled(item.id)"
              />
              <span class="topic-vote__option-index">{{ index + 1 }}</span>
              <span>{{ item.description }}</span>
            </span>
            <span v-if="!hideResults" class="topic-vote__result">
              <strong>{{ item.count }} 票</strong>
              <span>{{ formatPercentage(item.count) }}</span>
            </span>
            <span v-else class="topic-vote__result-hidden">投票后显示结果</span>
          </span>
          <span
            v-if="!hideResults"
            class="topic-vote__progress"
            role="progressbar"
            :aria-label="`${item.description}得票占比`"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-valuenow="itemPercentage(item.count)"
          >
            <span
              class="topic-vote__progress-value"
              :style="{ width: `${itemPercentage(item.count)}%` }"
            />
          </span>
        </label>
      </fieldset>

      <div class="topic-vote__meta" aria-label="投票信息">
        <span>
          <span class="i-heroicons-user-group" aria-hidden="true" />
          {{ participantCount }} 人参与
        </span>
        <span>
          <span class="i-heroicons-check-badge" aria-hidden="true" />
          最多选择 {{ maxVoteCount }} 项
        </span>
        <span>
          <span class="i-heroicons-clock" aria-hidden="true" />
          截止 {{ formatExpiredTime(vote?.expiredTime) }}
        </span>
      </div>

      <div v-if="hasVoted" class="topic-vote__message topic-vote__message--success">
        <span class="i-heroicons-check-circle" aria-hidden="true" />
        <span>
          你已经投过票<span v-if="selectedDescriptions.length"
            >：{{ selectedDescriptions.join("、") }}</span
          >。
        </span>
      </div>
      <div v-else-if="hideResults" class="topic-vote__message">
        <span class="i-heroicons-eye-slash" aria-hidden="true" />
        完成投票后可查看票数与占比。
      </div>
      <div
        v-else-if="vote?.isAvailable === false"
        class="topic-vote__message topic-vote__message--muted"
      >
        <span class="i-heroicons-lock-closed" aria-hidden="true" />
        投票已结束，结果仅供查看。
      </div>

      <p v-if="submitError" class="topic-vote__submit-error">{{ submitError }}</p>
      <footer v-if="vote?.canVote" class="topic-vote__actions">
        <span class="topic-vote__selection-count">
          已选 {{ selected.length }} / {{ maxVoteCount }} 项
        </span>
        <div>
          <UiButton
            variant="text"
            size="sm"
            :disabled="selected.length === 0 || submitVote.isPending.value"
            @click="selected = []"
          >
            清空选择
          </UiButton>
          <UiButton
            type="button"
            size="sm"
            :disabled="!canSubmit"
            :loading="submitVote.isPending.value"
            @click="submit"
          >
            {{ submitVote.isPending.value ? "提交中…" : "提交投票" }}
          </UiButton>
        </div>
      </footer>
    </template>
  </section>
</template>

<style scoped>
.topic-vote {
  margin: -0.75rem 0 1.5rem;
  overflow: hidden;
  border: 1px solid var(--cc98-color-border);
  border-left: 4px solid var(--cc98-color-primary);
  border-radius: var(--cc98-radius-sm);
  background: color-mix(in srgb, var(--cc98-color-surface-subtle) 72%, var(--cc98-color-surface));
}

.topic-vote__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.125rem 0.875rem;
  border-bottom: 1px solid var(--cc98-color-border);
  background: var(--cc98-color-surface);
}

.topic-vote__heading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.topic-vote__heading-icon {
  color: var(--cc98-color-primary);
  font-size: 1.75rem;
}

.topic-vote__heading h2,
.topic-vote__heading p {
  margin: 0;
}

.topic-vote__heading h2 {
  font-size: 1rem;
  line-height: 1.4;
}

.topic-vote__heading p {
  color: var(--cc98-color-text-muted);
  font-size: 0.75rem;
}

.topic-vote__status {
  padding: 0.2rem 0.6rem;
  border: 1px solid currentcolor;
  border-radius: var(--cc98-radius-full);
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.4;
}

.topic-vote__status--primary {
  background: color-mix(in srgb, var(--cc98-color-primary) 10%, transparent);
  color: var(--cc98-color-primary);
}

.topic-vote__status--success {
  background: color-mix(in srgb, var(--cc98-color-success) 10%, transparent);
  color: var(--cc98-color-success);
}

.topic-vote__status--muted {
  background: color-mix(in srgb, var(--cc98-color-text-muted) 8%, transparent);
  color: var(--cc98-color-text-muted);
}

.topic-vote__options {
  display: grid;
  gap: 0.625rem;
  min-width: 0;
  margin: 0;
  padding: 1rem 1.125rem;
  border: 0;
}

.topic-vote__option {
  --vote-color: var(--cc98-color-primary);

  display: grid;
  gap: 0.6rem;
  min-width: 0;
  padding: 0.75rem 0.875rem;
  border: 1px solid var(--cc98-color-border);
  border-radius: var(--cc98-radius-sm);
  background: var(--cc98-color-surface);
  cursor: pointer;
  transition:
    border-color 120ms ease,
    background-color 120ms ease;
}

.topic-vote__option:hover {
  border-color: color-mix(in srgb, var(--vote-color) 58%, var(--cc98-color-border));
}

.topic-vote__option--selected {
  border-color: var(--vote-color);
  background: color-mix(in srgb, var(--vote-color) 7%, var(--cc98-color-surface));
}

.topic-vote__option--tone-0 {
  --vote-color: var(--cc98-color-accent);
}

.topic-vote__option--tone-1 {
  --vote-color: var(--cc98-color-warning);
}

.topic-vote__option--tone-2 {
  --vote-color: var(--cc98-color-success);
}

.topic-vote__option--tone-3 {
  --vote-color: var(--cc98-color-primary);
}

.topic-vote__option--tone-4 {
  --vote-color: var(--cc98-color-secondary);
}

.topic-vote__option-row,
.topic-vote__option-label,
.topic-vote__result {
  display: flex;
  align-items: center;
}

.topic-vote__option-row {
  justify-content: space-between;
  gap: 1rem;
}

.topic-vote__option-label {
  min-width: 0;
  gap: 0.625rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.topic-vote__checkbox {
  width: 1rem;
  height: 1rem;
  margin: 0;
  accent-color: var(--vote-color);
}

.topic-vote__option-index {
  display: inline-grid;
  flex: 0 0 auto;
  width: 1.35rem;
  height: 1.35rem;
  border-radius: var(--cc98-radius-full);
  background: color-mix(in srgb, var(--vote-color) 12%, transparent);
  color: var(--vote-color);
  font-size: 0.7rem;
  font-weight: 700;
  place-items: center;
}

.topic-vote__result {
  flex: 0 0 auto;
  gap: 0.45rem;
  color: var(--cc98-color-text-muted);
  font-size: 0.75rem;
}

.topic-vote__result strong {
  color: var(--cc98-color-text);
  font-size: 0.8125rem;
}

.topic-vote__result-hidden {
  color: var(--cc98-color-text-caption);
  font-size: 0.75rem;
}

.topic-vote__progress {
  display: block;
  height: 0.4rem;
  overflow: hidden;
  border-radius: var(--cc98-radius-full);
  background: color-mix(in srgb, var(--cc98-color-text) 12%, transparent);
}

.topic-vote__progress-value {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--vote-color);
  transition: width 240ms ease;
}

.topic-vote__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.25rem;
  padding: 0 1.125rem 1rem;
  color: var(--cc98-color-text-muted);
  font-size: 0.75rem;
}

.topic-vote__meta > span,
.topic-vote__message {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.topic-vote__meta [class*="i-heroicons"] {
  color: var(--cc98-color-primary);
  font-size: 1rem;
}

.topic-vote__message {
  margin: 0 1.125rem 1rem;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--cc98-color-border);
  border-radius: var(--cc98-radius-sm);
  background: var(--cc98-color-surface);
  color: var(--cc98-color-text-muted);
  font-size: 0.8125rem;
}

.topic-vote__message--success {
  border-color: color-mix(in srgb, var(--cc98-color-success) 45%, var(--cc98-color-border));
  background: color-mix(in srgb, var(--cc98-color-success) 8%, var(--cc98-color-surface));
  color: var(--cc98-color-text);
}

.topic-vote__message--success > [class*="i-heroicons"] {
  color: var(--cc98-color-success);
}

.topic-vote__message--error,
.topic-vote__submit-error {
  color: var(--cc98-color-error);
}

.topic-vote__message--muted {
  color: var(--cc98-color-text-muted);
}

.topic-vote__submit-error {
  margin: 0 1.125rem 0.75rem;
  font-size: 0.8125rem;
}

.topic-vote__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1.125rem;
  border-top: 1px solid var(--cc98-color-border);
  background: var(--cc98-color-surface);
}

.topic-vote__actions > div {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.topic-vote__selection-count {
  color: var(--cc98-color-text-muted);
  font-size: 0.75rem;
}

.topic-vote__loading {
  display: grid;
  gap: 0.75rem;
  padding: 1rem 1.125rem;
  color: var(--cc98-color-text-muted);
  font-size: 0.8125rem;
}

.topic-vote__skeleton {
  height: 3.25rem;
  border-radius: var(--cc98-radius-sm);
  background: color-mix(in srgb, var(--cc98-color-text) 7%, transparent);
}

@media (max-width: 760px) {
  .topic-vote__option-row,
  .topic-vote__actions {
    align-items: stretch;
    flex-direction: column;
  }

  .topic-vote__result {
    justify-content: space-between;
  }

  .topic-vote__actions > div {
    justify-content: flex-end;
  }
}

@media (prefers-reduced-motion: reduce) {
  .topic-vote__option,
  .topic-vote__progress-value {
    transition: none;
  }
}
</style>
