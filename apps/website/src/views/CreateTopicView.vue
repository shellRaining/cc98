<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { useRouter } from "vue-router";
import type { CreateTopicRequest, CreateVoteInfo } from "@cc98/api";
import { boardQuery, boardTagsQuery } from "../api/queries";
import { useCreateTopicMutation, useUploadFilesMutation } from "../api/mutations";
import MarkdownEditor from "../components/MarkdownEditor.vue";
import PageState from "../components/PageState.vue";
import UiButton from "../components/ui/Button.vue";
import { normalizeApiError } from "../lib/api-error";
import { clearDraft, createDraftKey, readDraft, writeDraft } from "../lib/drafts";
import { validateCreateVote } from "../lib/interactions";
import { parsePositiveInt } from "../lib/route-params";
import { useUserStore } from "../stores/user";

const props = defineProps<{ boardId: string }>();
const router = useRouter();
const user = useUserStore();
const numericBoardId = computed(() => parsePositiveInt(props.boardId));
const authScope = computed(() => user.user?.id ?? "anonymous");

interface TopicDraft {
  title: string;
  content: string;
  isAnonymous: boolean;
  tag1: number | null;
  tag2: number | null;
  isVote: boolean;
  voteItems: string[];
  expiredDays: number;
  maxVoteCount: number;
  needVote: boolean;
}

const initialDraft: TopicDraft = {
  title: "",
  content: "",
  isAnonymous: false,
  tag1: null,
  tag2: null,
  isVote: false,
  voteItems: ["", ""],
  expiredDays: 7,
  maxVoteCount: 1,
  needVote: false,
};
const draftKey = createDraftKey("create-topic", numericBoardId.value ?? 0);
const draft = reactive(readDraft(draftKey, initialDraft));
watch(draft, (value) => writeDraft(draftKey, value), { deep: true });

const boardOptions = computed(() =>
  boardQuery(numericBoardId.value ?? 0, authScope.value, numericBoardId.value != null),
);
const tagsOptions = computed(() =>
  boardTagsQuery(numericBoardId.value ?? 0, numericBoardId.value != null),
);
const { data: board, error: boardError, isPending: boardPending, refetch } = useQuery(boardOptions);
const { data: tagGroups } = useQuery(tagsOptions);
const createTopic = useCreateTopicMutation();
const upload = useUploadFilesMutation();
const submitError = ref("");

const pageError = computed(() => {
  if (numericBoardId.value == null) return normalizeApiError({ status: 404 });
  if (boardError.value) return normalizeApiError(boardError.value);
  return null;
});
const stateKind = computed(() => {
  if (numericBoardId.value == null || pageError.value?.kind === "not-found")
    return "not-found" as const;
  if (boardPending.value) return "loading" as const;
  if (pageError.value?.kind === "forbidden") return "forbidden" as const;
  if (pageError.value) return "error" as const;
  return null;
});

async function uploadImages(files: File[]) {
  return upload.mutateAsync({ files });
}

async function uploadAttachments(files: File[]) {
  return upload.mutateAsync({ files, compressImage: false });
}

function addVoteItem() {
  if (draft.voteItems.length < 20) draft.voteItems.push("");
}

function removeVoteItem(index: number) {
  if (draft.voteItems.length <= 2) return;
  draft.voteItems.splice(index, 1);
  draft.maxVoteCount = Math.min(draft.maxVoteCount, draft.voteItems.length);
}

async function submit() {
  if (createTopic.isPending.value || numericBoardId.value == null) return;
  submitError.value = "";
  if (!draft.title.trim()) {
    submitError.value = "请填写主题标题";
    return;
  }
  if (!draft.content.trim()) {
    submitError.value = "请填写主题内容";
    return;
  }
  if (draft.content.length > 20_000) {
    submitError.value = "主题内容不能超过 20000 字";
    return;
  }

  const isVote = board.value?.canVote === true && draft.isVote;
  const voteInfo: CreateVoteInfo | undefined = isVote
    ? {
        voteItems: draft.voteItems.map((item) => item.trim()),
        expiredDays: draft.expiredDays,
        maxVoteCount: draft.maxVoteCount,
        needVote: draft.needVote,
      }
    : undefined;
  if (voteInfo) {
    const voteError = validateCreateVote(voteInfo);
    if (voteError) {
      submitError.value = voteError;
      return;
    }
  }

  const payload: CreateTopicRequest = {
    title: draft.title.trim(),
    content: draft.content,
    contentType: 1,
    type: 0,
    tag1: draft.tag1 ?? undefined,
    tag2: draft.tag2 ?? undefined,
    notifyPoster: false,
    isAnonymous: draft.isAnonymous,
    clientType: 1,
    isVote,
    voteInfo,
  };

  try {
    const topicId = await createTopic.mutateAsync({
      boardId: numericBoardId.value,
      authScope: authScope.value,
      payload,
    });
    clearDraft(draftKey);
    await router.push({ name: "topic", params: { topicId: String(topicId) } });
  } catch (error) {
    submitError.value = normalizeApiError(error, {
      forbiddenMessage: "你没有在该版面发主题的权限",
    }).message;
  }
}
</script>

<template>
  <section class="space-y-4">
    <nav class="text-sm text-cc98-text-muted">
      <RouterLink :to="{ name: 'board', params: { boardId } }" class="cc98-link">
        {{ board?.name ?? `版面 ${boardId}` }}
      </RouterLink>
      <span> / 发主题</span>
    </nav>

    <PageState
      v-if="stateKind"
      :kind="stateKind"
      :message="pageError?.message"
      :show-retry="stateKind === 'error'"
      @retry="refetch"
    />

    <form v-else class="cc98-card p-4 space-y-4" @submit.prevent="submit">
      <h1 class="text-xl font-semibold">在「{{ board?.name ?? `版面 ${boardId}` }}」发主题</h1>

      <label class="block space-y-1">
        <span class="text-sm">标题</span>
        <input
          v-model="draft.title"
          type="text"
          maxlength="100"
          required
          :disabled="createTopic.isPending.value"
          class="w-full cc98-input"
        />
      </label>

      <div v-if="tagGroups?.length" class="flex flex-wrap gap-4">
        <label v-for="group in tagGroups" :key="group.layer" class="space-y-1 text-sm">
          <span class="block">标签 {{ group.layer ?? "" }}</span>
          <select
            v-model="draft[group.layer === 2 ? 'tag2' : 'tag1']"
            :disabled="createTopic.isPending.value"
            class="cc98-input"
          >
            <option :value="null">不选择</option>
            <option v-for="tag in group.tags" :key="tag.id" :value="tag.id">
              {{ tag.name ?? `标签 ${tag.id}` }}
            </option>
          </select>
        </label>
      </div>

      <MarkdownEditor
        v-model="draft.content"
        :disabled="createTopic.isPending.value"
        :upload-images="uploadImages"
        :upload-attachments="uploadAttachments"
      />

      <label class="flex items-center gap-2 text-sm">
        <input
          v-model="draft.isAnonymous"
          type="checkbox"
          :disabled="createTopic.isPending.value"
        />
        匿名发布
      </label>

      <fieldset v-if="board?.canVote" class="rounded border border-cc98-border p-4 space-y-3">
        <label class="flex items-center gap-2 text-sm font-medium">
          <input v-model="draft.isVote" type="checkbox" :disabled="createTopic.isPending.value" />
          创建投票主题
        </label>
        <template v-if="draft.isVote">
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="space-y-1 text-sm">
              <span class="block">有效天数（1–1000）</span>
              <input
                v-model.number="draft.expiredDays"
                type="number"
                min="1"
                max="1000"
                class="w-full cc98-input"
                :disabled="createTopic.isPending.value"
              />
            </label>
            <label class="space-y-1 text-sm">
              <span class="block">每人最多选择</span>
              <input
                v-model.number="draft.maxVoteCount"
                type="number"
                min="1"
                :max="draft.voteItems.length"
                class="w-full cc98-input"
                :disabled="createTopic.isPending.value"
              />
            </label>
          </div>
          <label class="flex items-center gap-2 text-sm">
            <input
              v-model="draft.needVote"
              type="checkbox"
              :disabled="createTopic.isPending.value"
            />
            投票后才显示结果
          </label>
          <div v-for="(_item, index) in draft.voteItems" :key="index" class="flex gap-2">
            <input
              v-model="draft.voteItems[index]"
              type="text"
              maxlength="50"
              :placeholder="`投票选项 ${index + 1}`"
              class="min-w-0 flex-1 cc98-input"
              :disabled="createTopic.isPending.value"
            />
            <UiButton
              v-if="draft.voteItems.length > 2"
              variant="text"
              size="sm"
              :disabled="createTopic.isPending.value"
              @click="removeVoteItem(index)"
            >
              删除
            </UiButton>
          </div>
          <UiButton
            variant="text"
            size="sm"
            :disabled="createTopic.isPending.value || draft.voteItems.length >= 20"
            @click="addVoteItem"
          >
            添加选项
          </UiButton>
        </template>
      </fieldset>

      <p v-if="submitError" class="text-sm text-cc98-accent">{{ submitError }}</p>
      <div class="flex gap-3">
        <UiButton type="submit" :loading="createTopic.isPending.value">
          {{ createTopic.isPending.value ? "发布中…" : "发布主题" }}
        </UiButton>
        <RouterLink :to="{ name: 'board', params: { boardId } }" class="cc98-link py-2">
          取消
        </RouterLink>
      </div>
    </form>
  </section>
</template>
