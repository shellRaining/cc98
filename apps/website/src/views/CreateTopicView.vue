<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { useTitle } from "@vueuse/core";
import { useRoute, useRouter } from "vue-router";
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
const route = useRoute();
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
  topicType: number;
  notifyPoster: boolean;
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
  topicType: 0,
  notifyPoster: true,
  voteItems: ["", ""],
  expiredDays: 7,
  maxVoteCount: 1,
  needVote: false,
};
const draftKey = createDraftKey("create-topic", numericBoardId.value ?? 0);
const draft = reactive(readDraft(draftKey, initialDraft));
if (route.query.vote === "1") draft.isVote = true;
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
const pageModeText = computed(() =>
  route.query.vote === "1" && board.value?.canVote ? "发表投票主题" : "发表主题",
);
const pageTitle = computed(() =>
  board.value?.name
    ? `${pageModeText.value} - ${board.value.name} - CC98 论坛`
    : `${pageModeText.value} - CC98 论坛`,
);
const canCreateActivity = computed(() => {
  const currentName = user.user?.name;
  return (
    (currentName != null && (board.value?.boardMasters ?? []).includes(currentName)) ||
    (user.user?.userTitleIds ?? []).includes(91)
  );
});
const anonymousState = computed(() => board.value?.anonymousState ?? 0);
const canChooseAnonymous = computed(() => [2, 3].includes(anonymousState.value));
const anonymousOnly = computed(() => anonymousState.value === 1);
useTitle(pageTitle);

watch(
  anonymousState,
  (state) => {
    if (state === 0) draft.isAnonymous = false;
    if (state === 1) draft.isAnonymous = true;
  },
  { immediate: true },
);

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
    type: draft.topicType === 1 && !canCreateActivity.value ? 0 : draft.topicType,
    tag1: draft.tag1 ?? undefined,
    tag2: draft.tag2 ?? undefined,
    notifyPoster: draft.notifyPoster,
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
  <section class="writing-page">
    <nav class="new-topics-breadcrumb" aria-label="当前位置">
      <RouterLink to="/">首页</RouterLink>
      <span>›</span>
      <RouterLink :to="{ name: 'board', params: { boardId } }">
        {{ board?.name ?? `版面 ${boardId}` }}
      </RouterLink>
      <span>›</span>
      <span>{{ pageModeText }}</span>
    </nav>
    <h1 class="writing-page__sr-only">{{ pageModeText }}</h1>

    <PageState
      v-if="stateKind"
      :kind="stateKind"
      :message="pageError?.message"
      :show-retry="stateKind === 'error'"
      @retry="refetch"
    />

    <form v-else class="writing-form" @submit.prevent="submit">
      <div class="writing-row writing-row--title">
        <div class="writing-row__label">主题标题</div>
        <div v-if="tagGroups?.length" class="writing-title-tags">
          <select
            v-for="group in tagGroups"
            :key="group.layer"
            v-model="draft[group.layer === 2 ? 'tag2' : 'tag1']"
            :disabled="createTopic.isPending.value"
            :aria-label="`标签 ${group.layer ?? ''}`"
          >
            <option :value="null">不选择</option>
            <option v-for="tag in group.tags" :key="tag.id" :value="tag.id">
              {{ tag.name ?? `标签 ${tag.id}` }}
            </option>
          </select>
        </div>
        <input
          v-model="draft.title"
          class="writing-title-input"
          type="text"
          maxlength="100"
          required
          placeholder="请输入新主题的标题"
          :disabled="createTopic.isPending.value"
        />
      </div>

      <p v-if="tagGroups?.some((group) => group.layer === 2)" class="writing-tag-notice">
        【提示】↓↓↓ 该版面有两层标签，请先选择第 1 个标签，再选择第 2 个标签 ↓↓↓
      </p>

      <div class="writing-row writing-row--options">
        <div class="writing-row__label">发帖类型</div>
        <label><input v-model.number="draft.topicType" type="radio" :value="0" /> 普通</label>
        <label><input v-model.number="draft.topicType" type="radio" :value="2" /> 学术通知</label>
        <label v-if="canCreateActivity">
          <input v-model.number="draft.topicType" type="radio" :value="1" /> 校园活动
        </label>
        <span class="writing-row__warning">（活动帖和学术帖请选择正确的发帖类型）</span>
      </div>

      <div class="writing-row writing-row--options">
        <div class="writing-row__label">高级选项</div>
        <label>
          <input v-model="draft.notifyPoster" type="checkbox" />
          接收消息提醒
        </label>
        <label v-if="canChooseAnonymous" class="writing-anonymous-option">
          <input v-model="draft.isAnonymous" type="checkbox" />
          匿名发布
        </label>
        <span v-else-if="anonymousOnly">本版面只允许匿名发布</span>
      </div>

      <div class="writing-row writing-row--content">
        <div class="writing-row__label">主题内容</div>
        <span>使用 Markdown 编辑，支持图片、附件和实时预览。</span>
      </div>

      <div class="writing-editor">
        <MarkdownEditor
          v-model="draft.content"
          :disabled="createTopic.isPending.value"
          :upload-images="uploadImages"
          :upload-attachments="uploadAttachments"
        />
      </div>

      <fieldset v-if="board?.canVote" class="writing-vote">
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

      <p v-if="submitError" class="writing-submit-error">{{ submitError }}</p>
      <div class="writing-actions">
        <UiButton type="submit" :loading="createTopic.isPending.value">
          {{ createTopic.isPending.value ? "发布中…" : "发布主题" }}
        </UiButton>
        <RouterLink :to="{ name: 'board', params: { boardId } }" class="cc98-link">
          取消
        </RouterLink>
      </div>
    </form>
  </section>
</template>
