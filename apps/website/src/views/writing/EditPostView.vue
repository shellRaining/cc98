<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { useTitle } from "@vueuse/core";
import { useRouter } from "vue-router";
import { POST_CONTENT_TYPE, type EditPostRequest } from "@cc98/api";
import { ubbToMarkdown } from "@cc98/ubb";
import { useEditPostMutation, useUploadFilesMutation } from "../../api/mutations";
import { boardQuery, boardTagsQuery, postOriginalQuery, topicQuery } from "../../api/queries";
import MarkdownEditor from "../../components/MarkdownEditor.vue";
import PageState from "../../components/PageState.vue";
import UiButton from "../../components/ui/Button.vue";
import { normalizeApiError } from "../../lib/api-error";
import { clearDraft, createDraftKey, readDraft, writeDraft } from "../../stores/drafts";
import { floorAnchorId, floorToPage, parsePositiveInt } from "../../lib/route-params";
import { useUserStore } from "../../stores/user";

const props = defineProps<{ postId: string }>();
const router = useRouter();
const user = useUserStore();
const numericPostId = computed(() => parsePositiveInt(props.postId));
const authScope = computed(() => user.user?.id ?? "anonymous");

interface EditDraft {
  title: string;
  content: string;
  tag1: number | null;
  tag2: number | null;
  topicType: number;
  notifyPoster: boolean;
}

const initialDraft: EditDraft = {
  title: "",
  content: "",
  tag1: null,
  tag2: null,
  topicType: 0,
  notifyPoster: true,
};
const draftKey = createDraftKey("edit", numericPostId.value ?? 0);
const hadDraft = localStorage.getItem(draftKey) != null;
const draft = reactive(readDraft(draftKey, initialDraft));
watch(draft, (value) => writeDraft(draftKey, value), { deep: true });

const originalOptions = computed(() =>
  postOriginalQuery(numericPostId.value ?? 0, authScope.value, numericPostId.value != null),
);
const { data: original, error: originalError, isPending, refetch } = useQuery(originalOptions);
const topicId = computed(() => original.value?.topicId ?? 0);
const boardId = computed(() => original.value?.boardId ?? 0);
const isTopicPost = computed(() => original.value?.floor === 1);
const topicOptions = computed(() => topicQuery(topicId.value, authScope.value, topicId.value > 0));
const boardOptions = computed(() => boardQuery(boardId.value, authScope.value, boardId.value > 0));
const tagsOptions = computed(() =>
  boardTagsQuery(boardId.value, boardId.value > 0 && isTopicPost.value),
);
const topicResult = useQuery(topicOptions);
const boardResult = useQuery(boardOptions);
const tagsResult = useQuery(tagsOptions);
const topic = topicResult.data;
const board = boardResult.data;
const tagGroups = tagsResult.data;
const pageModeText = computed(() => (isTopicPost.value ? "编辑主题" : "编辑回复"));
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
useTitle(pageTitle);
const initialized = ref(false);
watch(
  [original, topic, board],
  ([post, topicInfo, boardInfo]) => {
    if (!post || initialized.value) return;
    if (!topicInfo || !boardInfo) return;
    initialized.value = true;
    if (hadDraft) return;
    draft.title = topicInfo.title || post.title || "";
    draft.content =
      post.contentType === POST_CONTENT_TYPE.markdown
        ? (post.content ?? "")
        : ubbToMarkdown(post.content ?? "");
    draft.tag1 = topicInfo?.tag1 ?? null;
    draft.tag2 = topicInfo?.tag2 ?? null;
    draft.topicType =
      topicInfo?.type === 1 && !canCreateActivity.value ? 0 : (topicInfo?.type ?? 0);
    draft.notifyPoster = topicInfo?.notifyPoster ?? true;
  },
  { immediate: true },
);

const editPost = useEditPostMutation();
const upload = useUploadFilesMutation();
const submitError = ref("");
const convertedFromUbb = computed(
  () => original.value?.contentType !== POST_CONTENT_TYPE.markdown && original.value != null,
);
const pageError = computed(() => {
  if (numericPostId.value == null) return normalizeApiError({ status: 404 });
  if (originalError.value) {
    return normalizeApiError(originalError.value, {
      forbiddenMessage: "你没有编辑该帖子的权限",
    });
  }
  if (topicResult.error.value) return normalizeApiError(topicResult.error.value);
  if (boardResult.error.value) return normalizeApiError(boardResult.error.value);
  if (tagsResult.error.value) return normalizeApiError(tagsResult.error.value);
  return null;
});
const stateKind = computed(() => {
  if (numericPostId.value == null || pageError.value?.kind === "not-found")
    return "not-found" as const;
  if (
    isPending.value ||
    (original.value != null && (topicResult.isPending.value || boardResult.isPending.value))
  )
    return "loading" as const;
  if (pageError.value?.kind === "forbidden") return "forbidden" as const;
  if (pageError.value) return "error" as const;
  return null;
});

async function refetchPage() {
  await Promise.all([
    refetch(),
    topicResult.refetch(),
    boardResult.refetch(),
    ...(isTopicPost.value ? [tagsResult.refetch()] : []),
  ]);
}

async function uploadImages(files: File[]) {
  return upload.mutateAsync({ files });
}

async function uploadAttachments(files: File[]) {
  return upload.mutateAsync({ files, compressImage: false });
}

async function submit() {
  if (editPost.isPending.value || numericPostId.value == null || !original.value) return;
  submitError.value = "";
  if (!draft.content.trim()) {
    submitError.value = "帖子内容不能为空";
    return;
  }
  if (draft.content.length > 20_000) {
    submitError.value = "帖子内容不能超过 20000 字";
    return;
  }

  const payload: EditPostRequest = {
    title: draft.title.trim(),
    content: draft.content,
    contentType: POST_CONTENT_TYPE.markdown,
    ...(isTopicPost.value
      ? {
          tag1: draft.tag1 ?? undefined,
          tag2: draft.tag2 ?? undefined,
          type: draft.topicType,
          notifyPoster: draft.notifyPoster,
        }
      : {}),
  };
  try {
    await editPost.mutateAsync({
      postId: numericPostId.value,
      topicId: original.value.topicId ?? 0,
      boardId: original.value.boardId,
      authScope: authScope.value,
      payload,
    });
    clearDraft(draftKey);
    if (original.value.topicId != null) {
      const floor = original.value.floor;
      const page = floor == null ? 1 : floorToPage(floor);
      await router.push({
        name: "topic",
        params: {
          topicId: String(original.value.topicId),
          ...(page > 1 ? { page: String(page) } : {}),
        },
        ...(floor != null ? { hash: `#${floorAnchorId(floor)}` } : {}),
      });
    } else {
      router.back();
    }
  } catch (error) {
    submitError.value = normalizeApiError(error, {
      forbiddenMessage: "你没有编辑该帖子的权限",
    }).message;
  }
}
</script>

<template>
  <section class="writing-page">
    <nav class="new-topics-breadcrumb" aria-label="当前位置">
      <RouterLink to="/">首页</RouterLink>
      <span>›</span>
      <RouterLink v-if="boardId > 0" :to="{ name: 'board', params: { boardId: String(boardId) } }">
        {{ board?.name ?? `版面 ${boardId}` }}
      </RouterLink>
      <span v-else>版面</span>
      <span>›</span>
      <span>{{ pageModeText }}</span>
    </nav>
    <h1 class="writing-page__sr-only">{{ pageModeText }}</h1>
    <PageState
      v-if="stateKind"
      :kind="stateKind"
      :message="pageError?.message"
      :show-retry="stateKind === 'error'"
      @retry="refetchPage"
    />

    <form v-else-if="original" class="writing-form" @submit.prevent="submit">
      <p v-if="convertedFromUbb" class="writing-conversion-notice">
        该帖子原为 UBB 格式，已转换成 Markdown。部分旧标签可能无法完整保留，请确认预览后再保存。
      </p>
      <div v-if="isTopicPost" class="writing-row writing-row--title">
        <div class="writing-row__label">主题标题</div>
        <div v-if="tagGroups?.length" class="writing-title-tags">
          <select
            v-for="group in tagGroups"
            :key="group.layer"
            v-model="draft[group.layer === 2 ? 'tag2' : 'tag1']"
            :disabled="editPost.isPending.value"
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
          :disabled="editPost.isPending.value"
          placeholder="请输入主题标题"
        />
      </div>
      <div v-if="isTopicPost" class="writing-row writing-row--options">
        <div class="writing-row__label">发帖类型</div>
        <label><input v-model.number="draft.topicType" type="radio" :value="0" /> 普通</label>
        <label><input v-model.number="draft.topicType" type="radio" :value="2" /> 学术通知</label>
        <label v-if="canCreateActivity">
          <input v-model.number="draft.topicType" type="radio" :value="1" /> 校园活动
        </label>
        <span class="writing-row__warning">（活动帖和学术帖请选择正确的发帖类型）</span>
      </div>
      <div v-if="isTopicPost" class="writing-row writing-row--options">
        <div class="writing-row__label">高级选项</div>
        <label>
          <input v-model="draft.notifyPoster" type="checkbox" />
          接收消息提醒
        </label>
      </div>
      <div class="writing-row writing-row--content">
        <div class="writing-row__label">{{ isTopicPost ? "主题内容" : "回复内容" }}</div>
        <span>使用 Markdown 编辑，支持图片、附件和实时预览。</span>
      </div>
      <div class="writing-editor">
        <MarkdownEditor
          v-model="draft.content"
          :disabled="editPost.isPending.value"
          :upload-images="uploadImages"
          :upload-attachments="uploadAttachments"
        />
      </div>
      <p v-if="submitError" class="writing-submit-error">{{ submitError }}</p>
      <div class="writing-actions">
        <UiButton type="submit" :loading="editPost.isPending.value">
          {{ editPost.isPending.value ? "保存中…" : "保存修改" }}
        </UiButton>
        <UiButton variant="ghost" @click="router.back()">取消</UiButton>
      </div>
    </form>
  </section>
</template>

<style scoped>
.new-topics-breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  color: var(--cc98-color-text-muted);
  font-size: 1rem;
}

.new-topics-breadcrumb a,
.new-topics-breadcrumb a:visited {
  color: var(--cc98-color-text-muted);
}

.writing-page {
  width: 100%;
  min-height: 48.75rem;
  margin-bottom: 3.75rem;
  color: var(--cc98-color-text);
  font-size: 0.875rem;
}

.writing-page__sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.writing-form {
  display: flex;
  flex-direction: column;
}

.writing-row {
  display: flex;
  min-height: 2.5rem;
  align-items: center;
  margin-bottom: 1.25rem;
  border: 1px solid var(--cc98-color-border);
  background: var(--cc98-color-surface);
}

.writing-row__label {
  display: grid;
  width: 7.5rem;
  align-self: stretch;
  flex: 0 0 7.5rem;
  border-right: 1px solid var(--cc98-color-border);
  place-items: center;
}

.writing-title-tags {
  display: flex;
  align-self: stretch;
}

.writing-title-tags select {
  width: 5rem;
  border: 0;
  border-right: 1px solid var(--cc98-color-border);
  background: transparent;
  color: var(--cc98-color-text);
  font: inherit;
  text-align: center;
}

.writing-title-input {
  min-width: 0;
  flex: 1;
  align-self: stretch;
  padding: 0 1rem;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--cc98-color-text);
  font: inherit;
}

.writing-title-input:focus,
.writing-title-tags select:focus {
  box-shadow: inset 0 -2px var(--cc98-color-primary);
}

.writing-conversion-notice {
  margin: -0.5rem 0 1.25rem;
  color: var(--cc98-color-accent);
  text-align: center;
}

.writing-conversion-notice {
  padding: 0.75rem 1rem;
  border: 1px solid var(--cc98-color-accent);
  background: var(--cc98-color-surface);
  text-align: left;
}

.writing-row--options {
  gap: 1.25rem;
}

.writing-row--options label {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.writing-row__warning {
  color: var(--cc98-color-accent);
}

.writing-row--content {
  justify-content: space-between;
  margin-bottom: 0;
}

.writing-row--content > span {
  flex: 1;
  padding: 0 1rem;
  color: var(--cc98-color-text-muted);
}

.writing-editor :deep(.md-editor) {
  height: 31.25rem;
  border: 1px solid var(--cc98-color-border);
  border-top: 0;
  border-radius: 0;
  box-shadow: none;
}

.writing-editor > div > :deep(div:not(.md-editor)) {
  padding-inline: 0.75rem;
}

.writing-submit-error {
  margin-top: 1rem;
  color: var(--cc98-color-accent);
  text-align: center;
}

.writing-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.25rem;
}
</style>
