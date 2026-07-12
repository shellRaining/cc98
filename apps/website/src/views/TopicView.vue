<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { useRoute, useRouter } from "vue-router";
import type { CreatePostRequest, Post } from "@cc98/api";
import dayjs from "dayjs";
import { useCreatePostMutation, useUploadFilesMutation } from "../api/mutations";
import { boardQuery, topicPostsQuery, topicQuery } from "../api/queries";
import MarkdownEditor from "../components/MarkdownEditor.vue";
import PageState from "../components/PageState.vue";
import Pagination from "../components/Pagination.vue";
import PostItem from "../components/PostItem.vue";
import TopicFavoriteAction from "../components/TopicFavoriteAction.vue";
import TopicVotePanel from "../components/TopicVotePanel.vue";
import { normalizeApiError } from "../lib/api-error";
import { clearDraft, createDraftKey, readDraft, writeDraft } from "../lib/drafts";
import { saveLoginRedirect } from "../lib/login-redirect";
import {
  clampPage,
  floorAnchorId,
  normalizeFloorHash,
  pageToFrom,
  parsePageNumber,
  parsePositiveInt,
  topicTotalPages,
} from "../lib/route-params";
import { useUserStore } from "../stores/user";

const props = defineProps<{
  topicId: string;
  page?: string;
}>();

const route = useRoute();
const router = useRouter();
const user = useUserStore();

const PAGE_SIZE = 10;
const numericTopicId = computed(() => parsePositiveInt(props.topicId));
const requestedPage = computed(() => parsePageNumber(props.page));
const invalidId = computed(() => numericTopicId.value == null);
const authScope = computed(() => user.user?.id ?? "anonymous");

interface ReplyDraft {
  content: string;
  isAnonymous: boolean;
  notifyAllReplier: boolean;
  parentId: number | null;
}

const initialReplyDraft: ReplyDraft = {
  content: "",
  isAnonymous: false,
  notifyAllReplier: false,
  parentId: null,
};
const draftKey = createDraftKey("reply", numericTopicId.value ?? 0);
const replyDraft = reactive(readDraft(draftKey, initialReplyDraft));
const persistDraft = ref(true);
watch(
  replyDraft,
  (value) => {
    if (persistDraft.value) writeDraft(draftKey, value);
  },
  { deep: true },
);
const createPost = useCreatePostMutation();
const upload = useUploadFilesMutation();
const replyError = ref("");
const pendingPostId = ref<number | null>(null);

const canLoad = computed(() => !invalidId.value && user.isLoggedIn);

const topicOptions = computed(() =>
  topicQuery(numericTopicId.value ?? 0, authScope.value, canLoad.value),
);
const {
  data: topic,
  error: topicError,
  isPending: topicPending,
  refetch: refetchTopic,
} = useQuery(topicOptions);

const totalPages = computed(() => topicTotalPages(topic.value?.replyCount, PAGE_SIZE));
const currentPage = computed(() => clampPage(requestedPage.value, totalPages.value));
const from = computed(() => pageToFrom(currentPage.value, PAGE_SIZE));

watch(
  [requestedPage, totalPages, numericTopicId],
  ([page, total, id]) => {
    if (id == null || total == null) return;
    const clamped = clampPage(page, total);
    if (page !== clamped) {
      void router.replace({
        name: "topic",
        params: {
          topicId: String(id),
          ...(clamped > 1 ? { page: String(clamped) } : {}),
        },
        hash: route.hash,
      });
    }
  },
  { flush: "post" },
);

const boardId = computed(() => topic.value?.boardId ?? null);
const boardOptions = computed(() =>
  boardQuery(boardId.value ?? 0, authScope.value, canLoad.value && boardId.value != null),
);
const { data: board } = useQuery(boardOptions);

const postsOptions = computed(() =>
  topicPostsQuery(
    numericTopicId.value ?? 0,
    authScope.value,
    from.value,
    PAGE_SIZE,
    canLoad.value && topic.value != null,
  ),
);
const {
  data: posts,
  error: postsError,
  isPending: postsPending,
  refetch: refetchPosts,
} = useQuery(postsOptions);

watch(
  [() => route.hash, posts],
  async ([hash]) => {
    const target = normalizeFloorHash(hash);
    if (!target) return;
    await nextTick();
    const el = document.getElementById(target);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  },
  { flush: "post" },
);

watch(posts, (items) => {
  if (pendingPostId.value == null) return;
  const created = items?.find((post) => post.id === pendingPostId.value);
  if (created?.floor == null) return;
  pendingPostId.value = null;
  void router.replace({
    name: "topic",
    params: {
      topicId: props.topicId,
      ...(currentPage.value > 1 ? { page: String(currentPage.value) } : {}),
    },
    hash: `#${floorAnchorId(created.floor)}`,
  });
});

const pageError = computed(() => {
  if (invalidId.value) return normalizeApiError({ status: 404 });
  if (!user.isLoggedIn) return normalizeApiError({ status: 401 });
  if (topicError.value) return normalizeApiError(topicError.value);
  if (postsError.value) return normalizeApiError(postsError.value);
  return null;
});

const stateKind = computed(() => {
  if (invalidId.value) return "not-found" as const;
  if (!user.isLoggedIn) return "unauthorized" as const;
  if (topicPending.value) return "loading" as const;
  if (pageError.value?.kind === "unauthorized") return "unauthorized" as const;
  if (pageError.value?.kind === "forbidden") return "forbidden" as const;
  if (pageError.value?.kind === "not-found") return "not-found" as const;
  if (pageError.value) return "error" as const;
  if (postsPending.value) return "loading" as const;
  if ((posts.value?.length ?? 0) === 0) return "empty" as const;
  return null;
});

const topicTitle = computed(() => topic.value?.title?.trim() || `主题 ${props.topicId}`);
const author = computed(() => {
  if (topic.value?.isAnonymous) return "匿名用户";
  return topic.value?.userName?.trim() || "已注销用户";
});
const timeText = computed(() => formatTime(topic.value?.time));
const replyTarget = computed(() => {
  if (replyDraft.parentId == null) return null;
  return posts.value?.find((post) => post.id === replyDraft.parentId) ?? null;
});

function formatTime(value: string | undefined): string {
  if (!value) return "—";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD HH:mm") : value;
}

function toPage(page: number) {
  return {
    name: "topic" as const,
    params: {
      topicId: props.topicId,
      ...(page > 1 ? { page: String(page) } : {}),
    },
  };
}

function goLogin() {
  saveLoginRedirect(route.fullPath);
  void router.push({ name: "logon" });
}

function retry() {
  void refetchTopic();
  void refetchPosts();
}

function quotePost(post: Post) {
  if (post.id == null) return;
  replyDraft.parentId = post.id;
  void nextTick(() =>
    document.getElementById("reply-editor")?.scrollIntoView({ behavior: "smooth" }),
  );
}

async function uploadImages(files: File[]) {
  return upload.mutateAsync({ files });
}

async function uploadAttachments(files: File[]) {
  return upload.mutateAsync({ files, compressImage: false });
}

async function submitReply() {
  if (createPost.isPending.value || numericTopicId.value == null) return;
  replyError.value = "";
  if (!replyDraft.content.trim()) {
    replyError.value = "请填写回复内容";
    return;
  }
  if (replyDraft.content.length > 20_000) {
    replyError.value = "回复内容不能超过 20000 字";
    return;
  }

  const payload: CreatePostRequest = {
    content: replyDraft.content,
    contentType: 1,
    title: "",
    parentId: replyDraft.parentId ?? undefined,
    isAnonymous: replyDraft.isAnonymous,
    notifyAllReplier: replyDraft.notifyAllReplier,
    clientType: 1,
  };
  try {
    const postId = await createPost.mutateAsync({
      topicId: numericTopicId.value,
      authScope: authScope.value,
      payload,
    });
    pendingPostId.value = postId;
    persistDraft.value = false;
    clearDraft(draftKey);
    Object.assign(replyDraft, initialReplyDraft);
    await nextTick();
    persistDraft.value = true;

    const refreshed = await refetchTopic();
    const lastPage = topicTotalPages(refreshed.data?.replyCount, PAGE_SIZE);
    await router.push({
      name: "topic",
      params: {
        topicId: props.topicId,
        ...(lastPage > 1 ? { page: String(lastPage) } : {}),
      },
    });
    await nextTick();
    await refetchPosts();
  } catch (error) {
    replyError.value = normalizeApiError(error, {
      forbiddenMessage: "你没有回复该主题的权限",
    }).message;
  }
}
</script>

<template>
  <section class="space-y-4">
    <nav class="text-sm text-cc98-text-muted flex flex-wrap gap-1">
      <RouterLink to="/boardlist" class="cc98-link">全部版面</RouterLink>
      <template v-if="board?.id != null">
        <span>/</span>
        <RouterLink :to="`/list/${board.id}`" class="cc98-link">
          {{ board.name ?? `版面 ${board.id}` }}
        </RouterLink>
      </template>
      <span>/</span>
      <span>{{ topicTitle }}</span>
    </nav>

    <PageState
      v-if="stateKind"
      :kind="stateKind"
      :message="pageError?.message"
      :show-retry="stateKind === 'error'"
      @login="goLogin"
      @retry="retry"
    />

    <template v-else-if="topic">
      <header class="space-y-2">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h1 class="text-2xl font-bold">{{ topicTitle }}</h1>
          <TopicFavoriteAction :topic-id="numericTopicId ?? 0" />
        </div>
        <p class="text-sm text-cc98-text-muted">
          {{ author }} · {{ timeText }} · 回复 {{ topic.replyCount ?? 0 }} · 浏览
          {{ topic.hitCount ?? 0 }}
          <span v-if="(topic.state ?? 0) > 0"> · 已锁定/特殊状态</span>
        </p>
      </header>

      <TopicVotePanel
        v-if="topic.isVote"
        :topic-id="numericTopicId ?? 0"
        :auth-scope="authScope"
        :enabled="user.isLoggedIn"
      />

      <Pagination :current-page="currentPage" :total-pages="totalPages" :to-page="toPage" />

      <ol class="space-y-4">
        <li v-for="post in posts" :key="post.id ?? post.floor">
          <PostItem :post="post" @reply="quotePost" />
        </li>
      </ol>

      <Pagination :current-page="currentPage" :total-pages="totalPages" :to-page="toPage" />

      <form
        v-if="(topic.state ?? 0) === 0"
        id="reply-editor"
        class="cc98-card p-4 space-y-4"
        @submit.prevent="submitReply"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h2 class="text-lg font-semibold">回复主题</h2>
          <p v-if="replyDraft.parentId != null" class="text-sm text-cc98-text-muted">
            正在引用
            <span v-if="replyTarget">
              #{{ replyTarget.floor ?? "?" }} {{ replyTarget.userName ?? "匿名用户" }}
            </span>
            <span v-else>帖子 {{ replyDraft.parentId }}</span>
            <button type="button" class="cc98-link ml-2" @click="replyDraft.parentId = null">
              取消引用
            </button>
          </p>
        </div>
        <MarkdownEditor
          v-model="replyDraft.content"
          :disabled="createPost.isPending.value"
          :upload-images="uploadImages"
          :upload-attachments="uploadAttachments"
          placeholder="写下你的回复"
        />
        <div class="flex flex-wrap gap-4 text-sm">
          <label class="flex items-center gap-2">
            <input
              v-model="replyDraft.isAnonymous"
              type="checkbox"
              :disabled="createPost.isPending.value"
            />
            匿名回复
          </label>
          <label class="flex items-center gap-2">
            <input
              v-model="replyDraft.notifyAllReplier"
              type="checkbox"
              :disabled="createPost.isPending.value"
            />
            通知参与者
          </label>
        </div>
        <p v-if="replyError" class="text-sm text-cc98-accent">{{ replyError }}</p>
        <button
          type="submit"
          :disabled="createPost.isPending.value"
          class="rounded bg-cc98-primary px-4 py-2 text-white disabled:opacity-50"
        >
          {{ createPost.isPending.value ? "提交中…" : "提交回复" }}
        </button>
      </form>
      <p v-else class="cc98-card p-4 text-sm text-cc98-text-muted">该主题当前不可回复。</p>
    </template>
  </section>
</template>
