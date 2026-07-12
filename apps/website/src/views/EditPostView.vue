<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { useRouter } from "vue-router";
import { POST_CONTENT_TYPE, type EditPostRequest } from "@cc98/api";
import { ubbToMarkdown } from "@cc98/ubb";
import { useEditPostMutation, useUploadFilesMutation } from "../api/mutations";
import { postOriginalQuery } from "../api/queries";
import MarkdownEditor from "../components/MarkdownEditor.vue";
import PageState from "../components/PageState.vue";
import { normalizeApiError } from "../lib/api-error";
import { clearDraft, createDraftKey, readDraft, writeDraft } from "../lib/drafts";
import { floorAnchorId, floorToPage, parsePositiveInt } from "../lib/route-params";
import { useUserStore } from "../stores/user";

const props = defineProps<{ postId: string }>();
const router = useRouter();
const user = useUserStore();
const numericPostId = computed(() => parsePositiveInt(props.postId));
const authScope = computed(() => user.user?.id ?? "anonymous");

interface EditDraft {
  title: string;
  content: string;
}

const initialDraft: EditDraft = { title: "", content: "" };
const draftKey = createDraftKey("edit", numericPostId.value ?? 0);
const hadDraft = localStorage.getItem(draftKey) != null;
const draft = reactive(readDraft(draftKey, initialDraft));
watch(draft, (value) => writeDraft(draftKey, value), { deep: true });

const originalOptions = computed(() =>
  postOriginalQuery(numericPostId.value ?? 0, authScope.value, numericPostId.value != null),
);
const { data: original, error: originalError, isPending, refetch } = useQuery(originalOptions);
const initialized = ref(false);
watch(
  original,
  (post) => {
    if (!post || initialized.value) return;
    initialized.value = true;
    if (hadDraft) return;
    draft.title = post.title ?? "";
    draft.content =
      post.contentType === POST_CONTENT_TYPE.markdown
        ? (post.content ?? "")
        : ubbToMarkdown(post.content ?? "");
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
  return null;
});
const stateKind = computed(() => {
  if (numericPostId.value == null || pageError.value?.kind === "not-found")
    return "not-found" as const;
  if (isPending.value) return "loading" as const;
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
  <section class="space-y-4">
    <h1 class="text-xl font-semibold">编辑帖子</h1>
    <PageState
      v-if="stateKind"
      :kind="stateKind"
      :message="pageError?.message"
      :show-retry="stateKind === 'error'"
      @retry="refetch"
    />

    <form v-else-if="original" class="cc98-card p-4 space-y-4" @submit.prevent="submit">
      <p
        v-if="convertedFromUbb"
        class="rounded border border-cc98-accent px-3 py-2 text-sm text-cc98-accent"
      >
        该帖子原为 UBB 格式，已转换成 Markdown。部分旧标签可能无法完整保留，请确认预览后再保存。
      </p>
      <label class="block space-y-1">
        <span class="text-sm">标题</span>
        <input
          v-model="draft.title"
          type="text"
          maxlength="100"
          :disabled="editPost.isPending.value"
          class="w-full rounded border border-cc98-border bg-cc98-bg px-3 py-2"
        />
      </label>
      <MarkdownEditor
        v-model="draft.content"
        :disabled="editPost.isPending.value"
        :upload-images="uploadImages"
        :upload-attachments="uploadAttachments"
      />
      <p v-if="submitError" class="text-sm text-cc98-accent">{{ submitError }}</p>
      <div class="flex gap-3">
        <button
          type="submit"
          :disabled="editPost.isPending.value"
          class="rounded bg-cc98-primary px-4 py-2 text-white disabled:opacity-50"
        >
          {{ editPost.isPending.value ? "保存中…" : "保存修改" }}
        </button>
        <button type="button" class="cc98-link" @click="router.back()">取消</button>
      </div>
    </form>
  </section>
</template>
