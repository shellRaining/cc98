<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { Post, PostLikeAction } from "@cc98/api";
import { useLikePostMutation } from "../../../api/mutations";
import { normalizeApiError } from "../../../lib/api-error";
import { saveLoginRedirect } from "../../../lib/login-redirect";
import { useUserStore } from "../../../stores/user";
import UiButton from "../../../components/ui/Button.vue";
import PostRatingDialog from "./PostRatingDialog.vue";

const props = defineProps<{
  post: Post;
}>();

const route = useRoute();
const router = useRouter();
const user = useUserStore();
const postId = computed(() => props.post.id ?? 0);
const topicId = computed(() => props.post.topicId ?? 0);
const likePost = useLikePostMutation();
const errorMessage = ref("");
const state = computed(() => props.post.likeState ?? 0);
const likeCount = computed(() => props.post.likeCount ?? 0);
const dislikeCount = computed(() => props.post.dislikeCount ?? 0);
const isOwn = computed(
  () =>
    props.post.isMe === true ||
    (!props.post.isAnonymous &&
      user.user?.id != null &&
      props.post.userId != null &&
      props.post.userId === user.user.id),
);

function goLogin() {
  saveLoginRedirect(route.fullPath);
  void router.push({ name: "logon" });
}

async function react(action: PostLikeAction) {
  if (likePost.isPending.value) return;
  errorMessage.value = "";
  if (!user.isLoggedIn) {
    goLogin();
    return;
  }
  if (isOwn.value) {
    errorMessage.value = "不能给自己的楼层点赞或点踩";
    return;
  }
  try {
    await likePost.mutateAsync({
      postId: postId.value,
      topicId: topicId.value,
      action,
    });
  } catch (error) {
    errorMessage.value = normalizeApiError(error, {
      forbiddenMessage: "操作过于频繁，或你没有互动权限",
    }).message;
  }
}
</script>

<template>
  <div class="post-reactions">
    <UiButton
      variant="text"
      size="sm"
      class="post-reaction"
      :class="{ 'post-reaction--active': state === 1 }"
      :aria-disabled="likePost.isPending.value"
      :aria-pressed="state === 1"
      :aria-label="state === 1 ? `取消赞，当前 ${likeCount} 个赞` : `赞，当前 ${likeCount} 个赞`"
      @click="react('1')"
    >
      <span
        v-if="state === 1"
        class="i-heroicons-hand-thumb-up-solid post-reaction__icon"
        aria-hidden="true"
      />
      <span v-else class="i-heroicons-hand-thumb-up post-reaction__icon" aria-hidden="true" />
      <span>{{ likeCount }}</span>
    </UiButton>
    <UiButton
      variant="text"
      size="sm"
      class="post-reaction"
      :class="{ 'post-reaction--active': state === 2 }"
      :aria-disabled="likePost.isPending.value"
      :aria-pressed="state === 2"
      :aria-label="
        state === 2 ? `取消踩，当前 ${dislikeCount} 个踩` : `踩，当前 ${dislikeCount} 个踩`
      "
      @click="react('2')"
    >
      <span
        v-if="state === 2"
        class="i-heroicons-hand-thumb-down-solid post-reaction__icon"
        aria-hidden="true"
      />
      <span v-else class="i-heroicons-hand-thumb-down post-reaction__icon" aria-hidden="true" />
      <span>{{ dislikeCount }}</span>
    </UiButton>
    <PostRatingDialog v-if="topicId > 0" :post-id="postId" :topic-id="topicId" :is-own="isOwn" />
    <span v-if="errorMessage" role="status" class="post-reactions__error">{{ errorMessage }}</span>
  </div>
</template>

<style scoped>
.post-reactions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.post-reaction {
  min-width: 0;
  height: auto;
  gap: 0.2rem;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--cc98-color-primary);
  font-size: 0.75rem;
  line-height: 1;
  transition: none;
}

.post-reaction:first-child {
  margin-right: 0.2rem;
}

.post-reaction:hover {
  background: transparent;
  color: var(--cc98-color-primary);
}

.post-reaction--active,
.post-reaction--active:hover {
  color: red;
}

.post-reaction__icon {
  flex: none;
  font-size: 1rem;
}

.post-reactions__error {
  color: var(--cc98-color-accent);
}
</style>
