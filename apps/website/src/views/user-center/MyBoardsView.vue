<script setup lang="ts">
import type { Board } from "@cc98/api";
import { useQuery } from "@tanstack/vue-query";
import { computed, ref, watch } from "vue";
import { useFollowBoardMutation, useUnfollowBoardMutation } from "../../api/mutations";
import { boardsByIdsQuery, currentUserQuery } from "../../api/queries";
import BoardIcon from "../../components/board/BoardIcon.vue";
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

const recentlyUnfollowed = ref(new Map<number, Board & { id: number }>());
const knownBoards = ref(new Map<number, Board & { id: number }>());
const boardOrder = ref<number[]>([]);
const pendingBoardId = ref(0);
const actionMessages = ref(new Map<number, string>());

watch(
  boardIds,
  (ids) => {
    boardOrder.value = [...boardOrder.value, ...ids.filter((id) => !boardOrder.value.includes(id))];
  },
  { immediate: true },
);

watch(
  boards,
  (value) => {
    if (!value) return;
    const next = new Map(knownBoards.value);
    for (const board of value) {
      if (board.id != null) next.set(board.id, { ...board, id: board.id });
    }
    knownBoards.value = next;
  },
  { immediate: true },
);

const rows = computed<Array<Board & { id: number }>>(() => {
  return boardOrder.value.flatMap((id) => {
    const board = knownBoards.value.get(id) ?? recentlyUnfollowed.value.get(id);
    return board ? [board] : [];
  });
});

const unfollow = useUnfollowBoardMutation();
const follow = useFollowBoardMutation();

function isFollowing(boardId: number): boolean {
  return boardIds.value.includes(boardId);
}

function buttonLabel(boardId: number): string {
  if (pendingBoardId.value === boardId) return isFollowing(boardId) ? "取关中" : "关注中";
  return actionMessages.value.get(boardId) ?? (isFollowing(boardId) ? "取消关注" : "重新关注");
}

function setActionMessage(boardId: number, message?: string) {
  const next = new Map(actionMessages.value);
  if (message) next.set(boardId, message);
  else next.delete(boardId);
  actionMessages.value = next;
}

async function toggleBoard(board: Board & { id: number }) {
  if (pendingBoardId.value) return;
  pendingBoardId.value = board.id;
  setActionMessage(board.id);
  if (isFollowing(board.id)) {
    const next = new Map(recentlyUnfollowed.value);
    next.set(board.id, board);
    recentlyUnfollowed.value = next;
    try {
      await unfollow.mutateAsync(board.id);
    } catch (mutationError) {
      const rollback = new Map(recentlyUnfollowed.value);
      rollback.delete(board.id);
      recentlyUnfollowed.value = rollback;
      setActionMessage(board.id, "取关失败");
      void normalizeApiError(mutationError);
    }
  } else {
    try {
      await follow.mutateAsync(board.id);
      const next = new Map(recentlyUnfollowed.value);
      next.delete(board.id);
      recentlyUnfollowed.value = next;
    } catch (mutationError) {
      setActionMessage(board.id, "关注失败");
      void normalizeApiError(mutationError);
    }
  }
  pendingBoardId.value = 0;
}
</script>

<template>
  <div class="user-content-page user-followed-boards">
    <PageState v-if="(mePending || boardsPending) && rows.length === 0" kind="loading" />
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
    <p v-else-if="rows.length === 0" class="user-content-empty">没有关注</p>
    <ul v-else class="user-followed-board-list">
      <li v-for="board in rows" :key="board.id">
        <RouterLink :to="`/list/${board.id}`" class="user-followed-board__icon">
          <BoardIcon
            class="user-followed-board__image"
            :src="board.logoUri"
            :name="board.name"
            :alt="board.name || `版面 ${board.id}`"
          />
        </RouterLink>
        <div class="user-followed-board__info">
          <RouterLink :to="`/list/${board.id}`">
            <h2>{{ board.name || `版面 ${board.id}` }}</h2>
          </RouterLink>
          <p>
            版主：{{ board.boardMasters?.join(" ") || "暂无" }} 今日主题
            {{ board.todayCount ?? 0 }} / 总主题 {{ board.topicCount ?? 0 }}
          </p>
        </div>
        <button
          type="button"
          :class="{ 'is-unfollowed': !isFollowing(board.id) }"
          :disabled="pendingBoardId !== 0"
          @click="toggleBoard(board)"
        >
          {{ buttonLabel(board.id) }}
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.user-content-page {
  min-height: 36rem;
}

.user-content-empty {
  margin: 2rem 0;
  color: var(--cc98-color-text-muted);
  text-align: center;
}

.user-followed-board-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.user-followed-board-list li {
  display: flex;
  align-items: center;
  min-height: 9rem;
  padding-bottom: 1.875rem;
}

.user-followed-board-list li + li {
  padding-top: 1.875rem;
  border-top: 1px dashed var(--cc98-color-border);
}

.user-followed-board__icon {
  display: block;
  width: 7rem;
  height: 7rem;
  flex: 0 0 7rem;
  overflow: hidden;
  border-radius: 50%;
  background: var(--cc98-color-primary-fill);
}

.user-followed-board__image {
  width: 7rem;
  height: 7rem;
  object-fit: cover;
}

.user-followed-board__info {
  max-width: 36.75rem;
  flex: 1 1 auto;
  margin-left: 3rem;
}

.user-followed-board__info h2 {
  margin: 0 0 1rem;
  color: var(--cc98-color-text);
  font-size: 1.125rem;
  font-weight: 400;
}

.user-followed-board__info p {
  margin: 0;
  color: var(--cc98-color-text-muted);
  white-space: nowrap;
}

.user-followed-board-list li > button {
  width: 6rem;
  height: 2rem;
  flex: 0 0 6rem;
  border: 0;
  border-radius: 0.5rem;
  background: var(--cc98-color-surface-subtle);
  color: var(--cc98-color-text-muted);
  font: inherit;
  cursor: pointer;
}

.user-followed-board-list li > button.is-unfollowed {
  background: var(--cc98-color-primary-fill);
  color: #fff;
}

.user-followed-board-list li > button:disabled {
  cursor: wait;
  opacity: 0.7;
}
</style>
