<script setup lang="ts">
import { computed, ref } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { useRoute, useRouter } from "vue-router";
import UiDialog from "./ui/Dialog.vue";
import UiButton from "./ui/Button.vue";
import { useAddFavoriteMutation, useRemoveFavoriteMutation } from "../api/mutations";
import { meFavoriteGroupsQuery, topicFavoriteQuery } from "../api/queries";
import { normalizeApiError } from "../lib/api-error";
import { saveLoginRedirect } from "../lib/login-redirect";
import { useUserStore } from "../stores/user";

const props = defineProps<{ topicId: number }>();
const route = useRoute();
const router = useRouter();
const user = useUserStore();
const authScope = computed(() => user.user?.id ?? "anonymous");
const favoriteOptions = computed(() =>
  topicFavoriteQuery(props.topicId, authScope.value, user.isLoggedIn),
);
const groupsOptions = computed(() => meFavoriteGroupsQuery(authScope.value, user.isLoggedIn));
const {
  data: isFavorite,
  error: favoriteError,
  isPending: favoritePending,
} = useQuery(favoriteOptions);
const { data: groups } = useQuery(groupsOptions);
const addFavorite = useAddFavoriteMutation();
const removeFavorite = useRemoveFavoriteMutation();
const open = ref(false);
const groupId = ref<number | null>(null);
const errorMessage = ref("");
const pending = computed(() => addFavorite.isPending.value || removeFavorite.isPending.value);

function goLogin() {
  saveLoginRedirect(route.fullPath);
  void router.push({ name: "logon" });
}

async function remove() {
  errorMessage.value = "";
  try {
    await removeFavorite.mutateAsync(props.topicId);
  } catch (error) {
    errorMessage.value = normalizeApiError(error, {
      forbiddenMessage: "你没有取消该收藏的权限",
    }).message;
  }
}

async function add() {
  errorMessage.value = "";
  try {
    await addFavorite.mutateAsync({
      topicId: props.topicId,
      groupId: groupId.value,
      authScope: authScope.value,
    });
    open.value = false;
  } catch (error) {
    errorMessage.value = normalizeApiError(error, {
      forbiddenMessage: "你没有收藏该主题的权限",
    }).message;
  }
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-2 text-sm">
    <UiButton v-if="!user.isLoggedIn" variant="ghost" size="sm" @click="goLogin">
      登录后收藏
    </UiButton>
    <UiButton v-else-if="isFavorite" variant="ghost" size="sm" :loading="pending" @click="remove">
      {{ pending ? "处理中…" : "取消收藏" }}
    </UiButton>
    <span v-else-if="favoritePending" class="text-cc98-text-muted">正在读取收藏状态…</span>
    <UiButton
      v-else-if="favoriteError"
      variant="ghost"
      size="sm"
      @click="errorMessage = normalizeApiError(favoriteError).message"
    >
      收藏状态不可用
    </UiButton>
    <UiDialog
      v-else
      v-model:open="open"
      title="收藏主题"
      description="选择收藏分组，之后可在用户中心管理。"
      confirm-label="确认收藏"
      :pending="pending"
      @confirm="add"
    >
      <template #trigger>
        <UiButton variant="ghost" size="sm" :loading="pending">收藏主题</UiButton>
      </template>
      <label class="mt-4 block space-y-1 text-sm">
        <span>收藏分组</span>
        <select v-model="groupId" class="w-full cc98-input" :disabled="pending">
          <option :value="null">默认收藏夹</option>
          <option v-for="group in groups?.data ?? []" :key="group.id" :value="group.id ?? null">
            {{ group.name ?? `分组 ${group.id}` }}
          </option>
        </select>
      </label>
      <p v-if="errorMessage" class="mt-3 text-sm text-cc98-accent">{{ errorMessage }}</p>
    </UiDialog>
    <span v-if="errorMessage && !open" role="status" class="text-cc98-accent">
      {{ errorMessage }}
    </span>
  </div>
</template>
