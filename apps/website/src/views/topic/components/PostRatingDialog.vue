<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { useRoute, useRouter } from "vue-router";
import type { PostRatingType } from "@cc98/api";
import UiDialog from "../../../components/ui/Dialog.vue";
import UiButton from "../../../components/ui/Button.vue";
import { useRatePostMutation } from "../../../api/mutations";
import { ratingReasonsQuery } from "../../../api/queries";
import { normalizeApiError } from "../../../lib/api-error";
import { saveLoginRedirect } from "../../../lib/login-redirect";
import { useUserStore } from "../../../stores/user";

const props = defineProps<{
  postId: number;
  topicId: number;
  isOwn: boolean;
}>();

const route = useRoute();
const router = useRouter();
const user = useUserStore();
const open = ref(false);
const type = ref<PostRatingType>(1);
const reasonId = ref<number | null>(null);
const errorMessage = ref("");
const authScope = computed(() => user.user?.id ?? "anonymous");
const reasonsOptions = computed(() =>
  ratingReasonsQuery(type.value, open.value && user.isLoggedIn && !props.isOwn),
);
const { data: reasons, isPending: reasonsPending } = useQuery(reasonsOptions);
const visibleReasons = computed(() =>
  (reasons.value ?? []).filter((reason) => reason.enabled && reason.type === type.value),
);
const ratePost = useRatePostMutation();

watch(type, () => {
  reasonId.value = null;
  errorMessage.value = "";
});

watch(open, (value) => {
  if (!value) {
    type.value = 1;
    reasonId.value = null;
    errorMessage.value = "";
  }
});

function goLogin() {
  open.value = false;
  saveLoginRedirect(route.fullPath);
  void router.push({ name: "logon" });
}

async function submit() {
  errorMessage.value = "";
  if (!user.isLoggedIn) {
    goLogin();
    return;
  }
  if (props.isOwn) {
    errorMessage.value = "不能给自己的楼层评分";
    return;
  }
  if (reasonId.value == null) {
    errorMessage.value = "请选择评分理由";
    return;
  }
  try {
    await ratePost.mutateAsync({
      postId: props.postId,
      topicId: props.topicId,
      authScope: authScope.value,
      payload: { reasonId: reasonId.value, type: type.value },
    });
    open.value = false;
  } catch (error) {
    errorMessage.value = normalizeApiError(error, {
      forbiddenMessage: "你不能重复评分，或当前没有评分权限",
    }).message;
  }
}
</script>

<template>
  <UiDialog
    v-model:open="open"
    title="楼层评分"
    description="选择正面或负面评分，并说明理由。"
    width-class="w-[min(30rem,calc(100vw-2rem))]"
  >
    <template #trigger>
      <UiButton variant="ghost" :loading="ratePost.isPending.value">评分</UiButton>
    </template>

    <div v-if="!user.isLoggedIn" class="mt-4 space-y-3">
      <p class="text-sm">登录后才能评分。</p>
      <UiButton variant="ghost" size="sm" @click="goLogin">前往登录</UiButton>
    </div>
    <p v-else-if="isOwn" class="mt-4 text-sm text-cc98-accent">不能给自己的楼层评分。</p>
    <template v-else>
      <div class="mt-4 flex gap-4 text-sm">
        <label class="flex items-center gap-2">
          <input v-model="type" type="radio" :value="1" :disabled="ratePost.isPending.value" />
          正面评分
        </label>
        <label class="flex items-center gap-2">
          <input v-model="type" type="radio" :value="2" :disabled="ratePost.isPending.value" />
          负面评分
        </label>
      </div>
      <label class="mt-4 block space-y-1 text-sm">
        <span>评分理由</span>
        <select
          v-model="reasonId"
          class="w-full cc98-input"
          :disabled="ratePost.isPending.value || reasonsPending"
        >
          <option :value="null">请选择</option>
          <option v-for="reason in visibleReasons" :key="reason.id" :value="reason.id">
            {{ reason.reason }}
          </option>
        </select>
      </label>
      <p
        v-if="!reasonsPending && visibleReasons.length === 0"
        class="mt-2 text-sm text-cc98-text-muted"
      >
        暂无可用评分理由。
      </p>
    </template>

    <p v-if="errorMessage" class="mt-3 text-sm text-cc98-accent">{{ errorMessage }}</p>

    <template v-if="user.isLoggedIn && !isOwn" #footer>
      <UiButton
        variant="ghost"
        size="sm"
        :disabled="ratePost.isPending.value"
        @click="open = false"
      >
        取消
      </UiButton>
      <UiButton
        size="sm"
        :disabled="reasonsPending || visibleReasons.length === 0"
        :loading="ratePost.isPending.value"
        @click="submit"
      >
        {{ ratePost.isPending.value ? "提交中…" : "提交评分" }}
      </UiButton>
    </template>
  </UiDialog>
</template>
