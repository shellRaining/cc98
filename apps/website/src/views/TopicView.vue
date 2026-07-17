<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from "vue";
import { useTitle } from "@vueuse/core";
import { useQuery } from "@tanstack/vue-query";
import { useRoute, useRouter } from "vue-router";
import type { CreatePostRequest, Post } from "@cc98/api";
import { useCreatePostMutation, useUploadFilesMutation } from "../api/mutations";
import {
  boardQuery,
  boardsQuery,
  boardTagsQuery,
  fullUsersByIdsQuery,
  homepageAdvertisementsQuery,
  topicFilteredPostsQuery,
  topicHotPostsQuery,
  topicPostsQuery,
  topicQuery,
} from "../api/queries";
import FullPageStatus from "../components/FullPageStatus.vue";
import HomeAdvertisement from "../components/home/HomeAdvertisement.vue";
import MarkdownEditor from "../components/MarkdownEditor.vue";
import PageState from "../components/PageState.vue";
import Pagination from "../components/Pagination.vue";
import PostItem from "../components/PostItem.vue";
import TopicFavoriteAction from "../components/TopicFavoriteAction.vue";
import TopicVotePanel from "../components/TopicVotePanel.vue";
import TopicHeader from "../components/topic/TopicHeader.vue";
import PostModerationDialog from "../components/topic/PostModerationDialog.vue";
import TopicHistoryDialog from "../components/topic/TopicHistoryDialog.vue";
import TopicIpDialog from "../components/topic/TopicIpDialog.vue";
import TopicModerationDialog from "../components/topic/TopicModerationDialog.vue";
import UiButton from "../components/ui/Button.vue";
import { normalizeApiError } from "../lib/api-error";
import { clearDraft, createDraftKey, readDraft, writeDraft } from "../lib/drafts";
import { visibleHomepageColumns } from "../lib/home.ts";
import { saveLoginRedirect } from "../lib/login-redirect";
import { shouldJumpToLatestReply } from "../lib/message-settings";
import {
  canManagePost,
  resolveTopicModerationAccess,
  type PostModerationAction,
  type TopicModerationAction,
} from "../lib/moderation";
import {
  clampPage,
  floorAnchorId,
  normalizeFloorHash,
  pageToFrom,
  parsePageNumber,
  parsePositiveInt,
  topicTotalPages,
} from "../lib/route-params";
import {
  filteredTopicTotalPages,
  resolveTopicPostFilter,
  topicViewQuery,
  uniquePostUserIds,
} from "../lib/topic-view.ts";
import { useUserStore } from "../stores/user";

const props = defineProps<{
  topicId: string;
  page?: string;
}>();

const PAGE_SIZE = 10;
const route = useRoute();
const router = useRouter();
const user = useUserStore();
const numericTopicId = computed(() => parsePositiveInt(props.topicId));
const requestedPage = computed(() => parsePageNumber(props.page));
const preliminaryPage = computed(() => Math.max(1, requestedPage.value));
const invalidId = computed(() => numericTopicId.value == null);
const authScope = computed(() => user.user?.id ?? "anonymous");
const filter = computed(() => resolveTopicPostFilter(route.query));
const canLoad = computed(() => !invalidId.value && user.isLoggedIn);

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
const createPost = useCreatePostMutation();
const upload = useUploadFilesMutation();
const replyError = ref("");
const pendingPostId = ref<number | null>(null);
const imagesCollapsed = ref(false);
const shareStatus = ref("");
const moderationOpen = ref(false);
const historyOpen = ref(false);
const ipOpen = ref(false);
const postModerationOpen = ref(false);
const selectedPost = ref<Post | null>(null);
let shareStatusTimer: ReturnType<typeof setTimeout> | undefined;

watch(
  replyDraft,
  (value) => {
    if (persistDraft.value) writeDraft(draftKey, value);
  },
  { deep: true },
);

const topicOptions = computed(() =>
  topicQuery(numericTopicId.value ?? 0, authScope.value, canLoad.value),
);
const {
  data: topic,
  error: topicError,
  isPending: topicPending,
  refetch: refetchTopic,
} = useQuery(topicOptions);

useTitle(
  computed(() => (topic.value?.title ? `${topic.value.title} - CC98 论坛` : "主题 - CC98 论坛")),
);

const boardId = computed(() => topic.value?.boardId ?? null);
const boardOptions = computed(() =>
  boardQuery(boardId.value ?? 0, authScope.value, canLoad.value && boardId.value != null),
);
const {
  data: board,
  error: boardError,
  isPending: boardPending,
  refetch: refetchBoard,
} = useQuery(boardOptions);

const moderationAccess = computed(() =>
  resolveTopicModerationAccess(user.user, board.value, topic.value),
);
const canModeratePosts = computed(() => canManagePost(user.user, board.value, topic.value));
const moderationBoardsOptions = computed(() => ({
  ...boardsQuery,
  enabled: moderationAccess.value.canManage,
}));
const { data: moderationBoardGroups } = useQuery(moderationBoardsOptions);

const tagsOptions = computed(() =>
  boardTagsQuery(boardId.value ?? 0, canLoad.value && boardId.value != null),
);
const { data: tagGroups } = useQuery(tagsOptions);
const tagNamesById = computed(() => {
  const result = new Map<number, string>();
  for (const group of tagGroups.value ?? []) {
    for (const tag of group.tags ?? []) {
      if (tag.id != null && tag.name) result.set(tag.id, tag.name);
    }
  }
  return result;
});
const topicTagNames = computed(() => {
  const result: string[] = [];
  for (const id of [topic.value?.tag1, topic.value?.tag2]) {
    if (id != null && id > 0) result.push(tagNamesById.value.get(id) ?? String(id));
  }
  return result;
});

const from = computed(() => pageToFrom(preliminaryPage.value, PAGE_SIZE));
const postsOptions = computed(() =>
  topicPostsQuery(
    numericTopicId.value ?? 0,
    authScope.value,
    from.value,
    PAGE_SIZE,
    canLoad.value && topic.value != null && filter.value.mode === "all",
  ),
);
const regularPostsQuery = useQuery(postsOptions);

const filteredMode = computed(() => (filter.value.mode === "all" ? "user" : filter.value.mode));
const filteredPostsOptions = computed(() =>
  topicFilteredPostsQuery(
    numericTopicId.value ?? 0,
    filteredMode.value,
    filter.value.targetId ?? 0,
    authScope.value,
    from.value,
    PAGE_SIZE,
    canLoad.value && topic.value != null && filter.value.mode !== "all",
  ),
);
const filteredPostsQuery = useQuery(filteredPostsOptions);
const filteredCountOptions = computed(() =>
  topicFilteredPostsQuery(
    numericTopicId.value ?? 0,
    filteredMode.value,
    filter.value.targetId ?? 0,
    authScope.value,
    0,
    1,
    canLoad.value && topic.value != null && filter.value.mode !== "all",
  ),
);
const filteredCountQuery = useQuery(filteredCountOptions);

const displayedPosts = computed(() =>
  filter.value.mode === "all"
    ? (regularPostsQuery.data.value ?? [])
    : (filteredPostsQuery.data.value ?? []),
);
const filteredReplyCount = computed(() => filteredCountQuery.data.value?.[0]?.count);
const totalPages = computed(() =>
  filter.value.mode === "all"
    ? topicTotalPages(topic.value?.replyCount, PAGE_SIZE)
    : filteredTopicTotalPages(filteredReplyCount.value, PAGE_SIZE),
);
const currentPage = computed(() => clampPage(preliminaryPage.value, totalPages.value));

watch(
  [requestedPage, totalPages, numericTopicId, filter],
  ([page, total, id, currentFilter]) => {
    if (id == null || total == null) return;
    const clamped = clampPage(page, total);
    if (page !== clamped) {
      void router.replace({
        name: "topic",
        params: {
          topicId: String(id),
          ...(clamped > 1 ? { page: String(clamped) } : {}),
        },
        query: topicViewQuery(currentFilter.mode, currentFilter.targetId),
        hash: route.hash,
      });
    }
  },
  { flush: "post" },
);

const hotPostsOptions = computed(() =>
  topicHotPostsQuery(
    numericTopicId.value ?? 0,
    authScope.value,
    canLoad.value &&
      topic.value != null &&
      filter.value.mode === "all" &&
      currentPage.value === 1 &&
      topic.value.disableHot !== true,
  ),
);
const hotPostsQuery = useQuery(hotPostsOptions);
const hotPosts = computed(() => {
  if (filter.value.mode !== "all" || currentPage.value !== 1 || topic.value?.disableHot === true) {
    return [];
  }
  return hotPostsQuery.data.value ?? [];
});

const allVisiblePosts = computed(() => [...displayedPosts.value, ...hotPosts.value]);
const postUserIds = computed(() => uniquePostUserIds(allVisiblePosts.value));
const usersOptions = computed(() =>
  fullUsersByIdsQuery(
    postUserIds.value,
    authScope.value,
    canLoad.value && postUserIds.value.length > 0,
  ),
);
const { data: postUsers } = useQuery(usersOptions);
const postUserMap = computed(
  () => new Map((postUsers.value ?? []).map((postUser) => [postUser.id, postUser])),
);

const advertisementsQuery = useQuery(homepageAdvertisementsQuery);
const advertisements = computed(() => visibleHomepageColumns(advertisementsQuery.data.value ?? []));

watch(
  [() => route.hash, displayedPosts, hotPosts],
  async ([hash]) => {
    const target = normalizeFloorHash(hash);
    if (!target) return;
    await nextTick();
    document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "center" });
  },
  { flush: "post" },
);

watch(displayedPosts, (items) => {
  if (pendingPostId.value == null) return;
  const created = items.find((post) => post.id === pendingPostId.value);
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

const activePostsError = computed(() =>
  filter.value.mode === "all"
    ? regularPostsQuery.error.value
    : (filteredPostsQuery.error.value ?? filteredCountQuery.error.value),
);
const activePostsPending = computed(() =>
  filter.value.mode === "all"
    ? regularPostsQuery.isPending.value
    : filteredPostsQuery.isPending.value || filteredCountQuery.isPending.value,
);
const pageError = computed(() => {
  if (invalidId.value) return normalizeApiError({ status: 404 });
  if (!user.isLoggedIn) return normalizeApiError({ status: 401 });
  if (topicError.value) return normalizeApiError(topicError.value);
  if (boardError.value) return normalizeApiError(boardError.value);
  if (activePostsError.value) return normalizeApiError(activePostsError.value);
  return null;
});
const stateKind = computed(() => {
  if (invalidId.value) return "not-found" as const;
  if (!user.isLoggedIn) return "unauthorized" as const;
  if (topicPending.value) return "loading" as const;
  if (boardId.value != null && boardPending.value) return "loading" as const;
  if (pageError.value?.kind === "unauthorized") return "unauthorized" as const;
  if (pageError.value?.kind === "forbidden") return "forbidden" as const;
  if (pageError.value?.kind === "not-found") return "not-found" as const;
  if (pageError.value) return "error" as const;
  if (activePostsPending.value) return "loading" as const;
  if (displayedPosts.value.length === 0) return "empty" as const;
  return null;
});

const topicTitle = computed(() => topic.value?.title?.trim() || `主题 ${props.topicId}`);
const replyTarget = computed(() => {
  if (replyDraft.parentId == null) return null;
  return allVisiblePosts.value.find((post) => post.id === replyDraft.parentId) ?? null;
});
const filterDescription = computed(() => {
  if (filter.value.mode === "trace") return "正在追踪与该楼层相关的回复";
  if (filter.value.mode === "user") return "当前只显示此人的回复";
  return "";
});

function toPage(page: number) {
  return {
    name: "topic" as const,
    params: {
      topicId: props.topicId,
      ...(page > 1 ? { page: String(page) } : {}),
    },
    query: topicViewQuery(filter.value.mode, filter.value.targetId),
  };
}

function goLogin() {
  saveLoginRedirect(route.fullPath);
  void router.push({ name: "logon" });
}

function retry() {
  void refetchTopic();
  void refetchBoard();
  if (filter.value.mode === "all") {
    void regularPostsQuery.refetch();
  } else {
    void filteredPostsQuery.refetch();
    void filteredCountQuery.refetch();
  }
}

function quotePost(post: Post) {
  if (post.id == null) return;
  replyDraft.parentId = post.id;
  void nextTick(() =>
    document.getElementById("reply-editor")?.scrollIntoView({ behavior: "smooth" }),
  );
}

function showOnlyUser(post: Post) {
  if (post.isAnonymous || post.userId == null) return;
  void router.push({
    name: "topic",
    params: { topicId: props.topicId },
    query: topicViewQuery("user", post.userId),
  });
}

function tracePost(post: Post) {
  if (post.id == null) return;
  void router.push({
    name: "topic",
    params: { topicId: props.topicId },
    query: topicViewQuery("trace", post.id),
  });
}

function showAllPosts() {
  void router.push({ name: "topic", params: { topicId: props.topicId } });
}

function toggleImages() {
  imagesCollapsed.value = !imagesCollapsed.value;
}

async function writeClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("复制失败");
}

async function shareTopic() {
  if (!topic.value || !board.value) return;
  const text = `【${board.value.name || "CC98"}】${topicTitle.value} https://www.cc98.org/topic/${numericTopicId.value} 复制本链接到浏览器或者打开【CC98】微信小程序查看~`;
  try {
    await writeClipboard(text);
    shareStatus.value = "已复制";
  } catch {
    shareStatus.value = "复制失败";
  }
  if (shareStatusTimer) clearTimeout(shareStatusTimer);
  shareStatusTimer = setTimeout(() => {
    shareStatus.value = "";
  }, 2500);
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
    const jumpToLatestReply = shouldJumpToLatestReply();
    const postId = await createPost.mutateAsync({
      topicId: numericTopicId.value,
      authScope: authScope.value,
      payload,
    });
    pendingPostId.value = jumpToLatestReply ? postId : null;
    persistDraft.value = false;
    clearDraft(draftKey);
    Object.assign(replyDraft, initialReplyDraft);
    await nextTick();
    persistDraft.value = true;

    const refreshed = await refetchTopic();
    if (jumpToLatestReply) {
      const lastPage = topicTotalPages(refreshed.data?.replyCount, PAGE_SIZE);
      await router.push({
        name: "topic",
        params: {
          topicId: props.topicId,
          ...(lastPage > 1 ? { page: String(lastPage) } : {}),
        },
      });
    }
    await nextTick();
    await regularPostsQuery.refetch();
  } catch (error) {
    replyError.value = normalizeApiError(error, {
      forbiddenMessage: "你没有回复该主题的权限",
    }).message;
  }
}

async function handleModerationCompleted(action: TopicModerationAction) {
  if (action === "delete") {
    await router.push({ name: "board", params: { boardId: String(boardId.value) } });
    return;
  }

  await Promise.all([
    refetchTopic(),
    refetchBoard(),
    filter.value.mode === "all"
      ? regularPostsQuery.refetch()
      : Promise.all([filteredPostsQuery.refetch(), filteredCountQuery.refetch()]),
    hotPostsQuery.refetch(),
  ]);
}

function openPostModeration(post: Post) {
  selectedPost.value = post;
  postModerationOpen.value = true;
}

async function handlePostModerationCompleted(_action: PostModerationAction) {
  await Promise.all([
    refetchTopic(),
    filter.value.mode === "all"
      ? regularPostsQuery.refetch()
      : Promise.all([filteredPostsQuery.refetch(), filteredCountQuery.refetch()]),
    hotPostsQuery.refetch(),
  ]);
}

onBeforeUnmount(() => {
  if (shareStatusTimer) clearTimeout(shareStatusTimer);
});
</script>

<template>
  <FullPageStatus v-if="stateKind === 'unauthorized'" kind="unauthorized" @login="goLogin" />
  <section v-else class="topic-page" :class="{ 'images-collapsed': imagesCollapsed }">
    <div class="topic-navigation-row">
      <nav class="topic-breadcrumb" aria-label="当前位置">
        <RouterLink to="/">首页</RouterLink>
        <span>›</span>
        <RouterLink to="/boardlist">版面列表</RouterLink>
        <template v-if="board?.id != null">
          <span>›</span>
          <RouterLink :to="`/list/${board.id}`">{{ board.name ?? `版面 ${board.id}` }}</RouterLink>
        </template>
        <span>›</span>
        <RouterLink :to="{ name: 'topic', params: { topicId } }">{{ topicTitle }}</RouterLink>
      </nav>
      <Pagination
        v-if="!stateKind"
        :current-page="currentPage"
        :total-pages="totalPages"
        :to-page="toPage"
      />
    </div>

    <PageState
      v-if="stateKind"
      :kind="stateKind"
      :message="pageError?.message"
      :show-retry="stateKind === 'error'"
      @login="goLogin"
      @retry="retry"
    />

    <template v-else-if="topic && board">
      <p v-if="(topic.state ?? 0) > 0" class="topic-locked-notice">该帖已被锁定</p>

      <TopicHeader
        :topic="topic"
        :board="board"
        :tag-names="topicTagNames"
        :images-collapsed="imagesCollapsed"
        :share-status="shareStatus"
        @toggle-images="toggleImages"
        @share="shareTopic"
      >
        <template #favorite>
          <TopicFavoriteAction :topic-id="numericTopicId ?? 0" />
        </template>
        <template #advertisement>
          <HomeAdvertisement v-if="advertisements.length" :items="advertisements" />
        </template>
      </TopicHeader>

      <div v-if="filter.mode !== 'all'" class="topic-filter-notice">
        <span>{{ filterDescription }}</span>
        <UiButton variant="text" type="button" size="sm" @click="showAllPosts">
          返回全部回复
        </UiButton>
      </div>

      <ol class="topic-post-list">
        <li v-for="(post, index) in displayedPosts" :key="post.id ?? post.floor">
          <PostItem
            :post="post"
            :user="post.userId ? postUserMap.get(post.userId) : undefined"
            :can-manage="canModeratePosts"
            @reply="quotePost"
            @filter-user="showOnlyUser"
            @trace="tracePost"
            @manage="openPostModeration"
          >
            <template v-if="topic.isVote && post.floor === 1" #before-content>
              <TopicVotePanel
                :topic-id="numericTopicId ?? 0"
                :auth-scope="authScope"
                :enabled="user.isLoggedIn"
              />
            </template>
          </PostItem>

          <div v-if="index === 0 && hotPosts.length" class="topic-hot-replies">
            <PostItem
              v-for="hotPost in hotPosts"
              :key="`hot-${hotPost.id ?? hotPost.floor}`"
              :post="hotPost"
              :user="hotPost.userId ? postUserMap.get(hotPost.userId) : undefined"
              :can-manage="canModeratePosts"
              hot
              @reply="quotePost"
              @filter-user="showOnlyUser"
              @trace="tracePost"
              @manage="openPostModeration"
            />
          </div>
        </li>
      </ol>

      <div class="topic-navigation-row topic-navigation-row--bottom">
        <nav class="topic-breadcrumb" aria-label="当前位置">
          <RouterLink to="/">首页</RouterLink>
          <span>›</span>
          <RouterLink to="/boardlist">版面列表</RouterLink>
          <span>›</span>
          <RouterLink :to="`/list/${board.id}`">{{ board.name }}</RouterLink>
        </nav>
        <Pagination :current-page="currentPage" :total-pages="totalPages" :to-page="toPage" />
      </div>

      <div v-if="moderationAccess.canManage" class="topic-moderation-toolbar">
        <UiButton size="sm" @click="moderationOpen = true">管理</UiButton>
        <UiButton v-if="moderationAccess.canViewHistory" size="sm" @click="historyOpen = true">
          管理记录
        </UiButton>
        <UiButton v-if="moderationAccess.canViewIp" size="sm" @click="ipOpen = true">
          查看 IP
        </UiButton>
      </div>

      <TopicModerationDialog
        v-model:open="moderationOpen"
        :topic="topic"
        :board-id="board.id ?? 0"
        :boards="moderationBoardGroups"
        :auth-scope="authScope"
        @completed="handleModerationCompleted"
      />
      <TopicHistoryDialog
        v-model:open="historyOpen"
        :topic-id="numericTopicId ?? 0"
        :auth-scope="authScope"
      />
      <TopicIpDialog
        v-if="moderationAccess.canViewIp"
        v-model:open="ipOpen"
        :topic-id="numericTopicId ?? 0"
        :auth-scope="authScope"
      />
      <PostModerationDialog
        v-if="selectedPost"
        v-model:open="postModerationOpen"
        :post="selectedPost"
        :topic-id="numericTopicId ?? 0"
        :board-id="board.id ?? 0"
        :board-name="board.name"
        :auth-scope="authScope"
        :full-manager="moderationAccess.canViewIp"
        @completed="handlePostModerationCompleted"
      />

      <form
        v-if="(topic.state ?? 0) === 0"
        id="reply-editor"
        class="topic-reply-editor"
        @submit.prevent="submitReply"
      >
        <div class="topic-reply-editor__heading">
          <h2>回复主题</h2>
          <p v-if="replyDraft.parentId != null">
            正在引用
            <span v-if="replyTarget">
              #{{ replyTarget.floor ?? "?" }} {{ replyTarget.userName ?? "匿名用户" }}
            </span>
            <span v-else>帖子 {{ replyDraft.parentId }}</span>
            <UiButton variant="text" type="button" size="sm" @click="replyDraft.parentId = null">
              取消引用
            </UiButton>
          </p>
        </div>
        <MarkdownEditor
          v-model="replyDraft.content"
          :disabled="createPost.isPending.value"
          :upload-images="uploadImages"
          :upload-attachments="uploadAttachments"
          placeholder="写下你的回复"
        />
        <div class="topic-reply-editor__options">
          <label>
            <input
              v-model="replyDraft.isAnonymous"
              type="checkbox"
              :disabled="createPost.isPending.value"
            />
            匿名回复
          </label>
          <label>
            <input
              v-model="replyDraft.notifyAllReplier"
              type="checkbox"
              :disabled="createPost.isPending.value"
            />
            通知参与者
          </label>
        </div>
        <p v-if="replyError" class="topic-reply-editor__error">{{ replyError }}</p>
        <UiButton type="submit" :loading="createPost.isPending.value">
          {{ createPost.isPending.value ? "提交中…" : "提交回复" }}
        </UiButton>
      </form>
      <p v-else class="topic-locked-card">该主题当前不可回复。</p>
    </template>
  </section>
</template>
