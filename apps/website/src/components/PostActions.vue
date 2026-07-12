<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { Post, PostLikeAction } from "@cc98/api";
import { useLikePostMutation } from "../api/mutations";
import { normalizeApiError } from "../lib/api-error";
import { saveLoginRedirect } from "../lib/login-redirect";
import { useUserStore } from "../stores/user";
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
  <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
    <button
      type="button"
      class="cc98-link disabled:opacity-50"
      :class="{ 'font-semibold text-cc98-primary': state === 1 }"
      :disabled="likePost.isPending.value"
      :aria-pressed="state === 1"
      @click="react('1')"
    >
      赞 {{ likeCount }}
    </button>
    <button
      type="button"
      class="cc98-link disabled:opacity-50"
      :class="{ 'font-semibold text-cc98-primary': state === 2 }"
      :disabled="likePost.isPending.value"
      :aria-pressed="state === 2"
      @click="react('2')"
    >
      踩 {{ dislikeCount }}
    </button>
    <PostRatingDialog v-if="topicId > 0" :post-id="postId" :topic-id="topicId" :is-own="isOwn" />
    <span v-if="errorMessage" role="status" class="text-cc98-accent">{{ errorMessage }}</span>
  </div>
</template>
