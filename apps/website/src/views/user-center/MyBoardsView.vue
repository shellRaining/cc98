<script setup lang="ts">
import type { Board } from "@cc98/api";
import { computed, ref } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { RouterLink } from "vue-router";
import { useUnfollowBoardMutation } from "../../api/mutations";
import { boardsByIdsQuery, currentUserQuery } from "../../api/queries";
import ConfirmDialog from "../../components/ConfirmDialog.vue";
import PageState from "../../components/PageState.vue";
import { normalizeApiError } from "../../lib/api-error";

const {
  data: me,
  error: meError,
  isPending: mePending,
  refetch: refetchMe,
} = useQuery(currentUserQuery);
const boardIds = computed(() => me.value?.customBoards ?? []);
const boardOptions = computed(() => boardsByIdsQuery(boardIds.value, boardIds.value.length > 0));
const {
  data: boards,
  error: boardsError,
  isPending: boardsPending,
  refetch: refetchBoards,
} = useQuery(boardOptions);
const rows = computed<Array<Board & { id: number }>>(() => {
  const byId = new Map(
    (boards.value ?? []).flatMap((board) => (board.id == null ? [] : [[board.id, board] as const])),
  );
  return boardIds.value.map((id) => byId.get(id) ?? { id, name: "版面信息不可用" });
});
const unfollow = useUnfollowBoardMutation();
const notice = ref("");

async function unfollowBoard(boardId: number) {
  try {
    await unfollow.mutateAsync(boardId);
    notice.value = "已取消关注版面";
  } catch (mutationError) {
    notice.value = normalizeApiError(mutationError).message;
  }
}
</script>

<template>
  <div class="space-y-4">
    <header>
      <h1 class="text-2xl font-bold">关注版面</h1>
      <p class="mt-1 text-sm text-cc98-text-muted">查看并管理自定义版面。</p>
    </header>
    <p v-if="notice" class="text-sm text-cc98-text-muted" role="status">{{ notice }}</p>
    <PageState v-if="mePending || boardsPending" kind="loading" />
    <PageState
      v-else-if="meError || boardsError"
      kind="error"
      :message="normalizeApiError(meError || boardsError).message"
      show-retry
      @retry="
        refetchMe();
        refetchBoards();
      "
    />
    <PageState v-else-if="rows.length === 0" kind="empty" message="还没有关注版面。" />
    <ul v-else class="cc98-card m-0 list-none divide-y divide-cc98-border px-4">
      <li v-for="board in rows" :key="board.id" class="flex items-start gap-4 py-4">
        <div class="min-w-0 flex-1">
          <RouterLink :to="`/list/${board.id}`" class="cc98-link font-medium">
            {{ board.name || `版面 ${board.id}` }}
          </RouterLink>
          <p v-if="board.description" class="mt-1 text-sm text-cc98-text-muted line-clamp-2">
            {{ board.description }}
          </p>
          <p class="mt-1 text-xs text-cc98-text-muted">
            主题 {{ board.topicCount ?? 0 }} · 今日 {{ board.todayCount ?? 0 }}
          </p>
        </div>
        <ConfirmDialog
          title="取消关注版面"
          :description="`确定不再关注 ${board.name || `版面 ${board.id}`} 吗？`"
          trigger-label="取消关注"
          :pending="unfollow.isPending.value"
          :disabled="unfollow.isPending.value"
          @confirm="unfollowBoard(board.id)"
        />
      </li>
    </ul>
  </div>
</template>
