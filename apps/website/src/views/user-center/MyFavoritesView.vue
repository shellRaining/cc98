<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import dayjs from "dayjs";
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  useCreateFavoriteGroupMutation,
  useDeleteFavoriteGroupMutation,
  useMoveFavoriteMutation,
  useRemoveFavoriteMutation,
  useRenameFavoriteGroupMutation,
} from "../../api/mutations";
import { boardsByIdsQuery, meFavoriteGroupsQuery, meFavoritesQuery } from "../../api/queries";
import PageState from "../../components/PageState.vue";
import Pagination from "../../components/Pagination.vue";
import UiDialog from "../../components/ui/Dialog.vue";
import { normalizeApiError } from "../../lib/api-error";
import { pageToFrom } from "../../lib/route-params";
import {
  normalizeFavoriteGroup,
  normalizeFavoriteKeyword,
  normalizeFavoriteOrder,
  parseUserCenterPage,
  userCenterPagePath,
} from "../../lib/user-center";
import { useUserStore } from "../../stores/user";

type GroupAction = "create" | "rename" | "delete";

const PAGE_SIZE = 10;
const route = useRoute();
const router = useRouter();
const user = useUserStore();
const authScope = computed(() => user.user?.id ?? "anonymous");
const page = computed(() => parseUserCenterPage(route.query.page));
const groupId = computed(() => normalizeFavoriteGroup(route.query.group));
const order = computed(() => normalizeFavoriteOrder(route.query.order));
const keyword = computed(() => normalizeFavoriteKeyword(route.query.keyword));
const draftKeyword = ref(keyword.value);
const notice = ref("");

const groupDialogOpen = ref(false);
const groupAction = ref<GroupAction>("create");
const createName = ref("");
const selectedGroupId = ref(0);
const renameName = ref("");

const moveDialogOpen = ref(false);
const movingTopicId = ref(0);
const moveTargetGroupId = ref(0);

watch(keyword, (value) => (draftKeyword.value = value));

const groupOptions = computed(() => meFavoriteGroupsQuery(authScope.value));
const { data: groupPage, error: groupError, refetch: refetchGroups } = useQuery(groupOptions);
const groups = computed(() => groupPage.value?.data ?? []);
const editableGroups = computed(() => groups.value.filter((group) => (group.id ?? 0) > 0));
const groupLimitReached = computed(() => editableGroups.value.length >= 10);

watch(
  editableGroups,
  (value) => {
    if (!value.some((group) => group.id === selectedGroupId.value)) {
      selectedGroupId.value = value[0]?.id ?? 0;
    }
  },
  { immediate: true },
);

const favoriteOptions = computed(() =>
  meFavoritesQuery(
    authScope.value,
    groupId.value,
    keyword.value ? 1 : order.value,
    keyword.value,
    pageToFrom(page.value, PAGE_SIZE),
    PAGE_SIZE + 1,
  ),
);
const { data, error, isPending, refetch } = useQuery(favoriteOptions);
const topics = computed(() => data.value?.slice(0, PAGE_SIZE) ?? []);
const hasNextPage = computed(() => (data.value?.length ?? 0) > PAGE_SIZE);
const boardIds = computed(() => topics.value.flatMap((topic) => topic.boardId ?? []));
const boardOptions = computed(() => boardsByIdsQuery(boardIds.value, boardIds.value.length > 0));
const boardQuery = useQuery(boardOptions);
const boardNames = computed(
  () => new Map(boardQuery.data.value?.map((board) => [board.id, board.name]) ?? []),
);

const createGroup = useCreateFavoriteGroupMutation();
const renameGroup = useRenameFavoriteGroupMutation();
const deleteGroup = useDeleteFavoriteGroupMutation();
const moveFavorite = useMoveFavoriteMutation();
const removeFavorite = useRemoveFavoriteMutation();
const mutationPending = computed(
  () =>
    createGroup.isPending.value ||
    renameGroup.isPending.value ||
    deleteGroup.isPending.value ||
    moveFavorite.isPending.value ||
    removeFavorite.isPending.value,
);

function filterPath(targetPage = 1) {
  return userCenterPagePath("/usercenter/favorites", targetPage, {
    group: groupId.value,
    order: keyword.value ? 1 : order.value,
    keyword: keyword.value || undefined,
  });
}

function updateFilter(next: { group?: number; order?: number; keyword?: string }) {
  void router.push(
    userCenterPagePath("/usercenter/favorites", 1, {
      group: next.group ?? groupId.value,
      order: next.keyword ? 1 : (next.order ?? order.value),
      keyword: next.keyword || undefined,
    }),
  );
}

function submitSearch() {
  const normalized = draftKeyword.value.trim();
  updateFilter({
    group: normalized ? 0 : groupId.value,
    order: normalized ? 1 : order.value,
    keyword: normalized,
  });
}

function openGroupDialog() {
  notice.value = "";
  groupAction.value = "create";
  groupDialogOpen.value = true;
}

async function submitGroupAction() {
  notice.value = "";
  try {
    if (groupAction.value === "create") {
      const name = createName.value.trim();
      if (!name || name.length > 10) {
        notice.value = "请输入最多 10 个字符且不为空的名称";
        return;
      }
      if (groupLimitReached.value) {
        notice.value = "收藏分组已达到上限";
        return;
      }
      await createGroup.mutateAsync(name);
      createName.value = "";
      notice.value = "收藏分组已创建";
    } else if (groupAction.value === "rename") {
      const name = renameName.value.trim();
      if (selectedGroupId.value <= 0 || !name || name.length > 10) {
        notice.value = "请选择分组，并填写最多 10 个字符的新名称";
        return;
      }
      await renameGroup.mutateAsync({ id: selectedGroupId.value, name });
      renameName.value = "";
      notice.value = "收藏分组已重命名";
    } else {
      if (selectedGroupId.value <= 0) {
        notice.value = "请选择需要删除的收藏分组";
        return;
      }
      const deletedId = selectedGroupId.value;
      await deleteGroup.mutateAsync(deletedId);
      if (groupId.value === deletedId) {
        await router.push(
          userCenterPagePath("/usercenter/favorites", 1, { group: 0, order: order.value }),
        );
      }
      notice.value = "收藏分组已删除，原有主题已移入默认分组";
    }
    groupDialogOpen.value = false;
  } catch (mutationError) {
    notice.value = normalizeApiError(mutationError).message;
  }
}

function openMoveDialog(topicId: number) {
  notice.value = "";
  movingTopicId.value = topicId;
  moveTargetGroupId.value = groups.value[0]?.id ?? 0;
  moveDialogOpen.value = true;
}

async function moveTopic() {
  if (movingTopicId.value <= 0 || moveTargetGroupId.value < 0) return;
  try {
    await moveFavorite.mutateAsync({
      topicId: movingTopicId.value,
      groupId: moveTargetGroupId.value,
    });
    moveDialogOpen.value = false;
    notice.value = "收藏主题已移动";
  } catch (mutationError) {
    notice.value = normalizeApiError(mutationError).message;
  }
}

async function removeTopic(topicId: number) {
  try {
    await removeFavorite.mutateAsync(topicId);
    notice.value = "已取消收藏";
  } catch (mutationError) {
    notice.value = normalizeApiError(mutationError).message;
  }
}

function formatTime(value: string | undefined): string {
  if (!value) return "—";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD HH:mm:ss") : value;
}
</script>

<template>
  <div class="user-content-page user-favorites">
    <div class="favorite-toolbar">
      <select
        :value="groupId"
        aria-label="收藏分组"
        :disabled="Boolean(keyword)"
        @change="
          updateFilter({ group: Number(($event.target as HTMLSelectElement).value), keyword: '' })
        "
      >
        <option v-for="group in groups" :key="group.id" :value="group.id">
          {{ group.name }}（{{ group.count ?? 0 }}）
        </option>
      </select>

      <select
        :value="order"
        aria-label="收藏排序"
        :disabled="Boolean(keyword)"
        @change="
          updateFilter({ order: Number(($event.target as HTMLSelectElement).value), keyword: '' })
        "
      >
        <option :value="0">按发帖时间排序</option>
        <option :value="1">按最后回复排序</option>
        <option :value="2">按收藏顺序排序</option>
      </select>

      <form class="favorite-search" @submit.prevent="submitSearch">
        <input
          v-model="draftKeyword"
          type="search"
          placeholder="输入关键词"
          aria-label="搜索收藏"
        />
        <button type="submit">搜索</button>
      </form>

      <button type="button" class="favorite-manage-button" @click="openGroupDialog">
        管理分组
      </button>
      <p class="favorite-toolbar__tip">收藏搜索目前只能按照最后回复排序</p>
    </div>

    <p v-if="groupError" class="favorite-message">
      {{ normalizeApiError(groupError).message }}
      <button type="button" @click="refetchGroups()">重试</button>
    </p>
    <p v-if="notice" class="favorite-message" role="status">{{ notice }}</p>

    <hr />

    <PageState v-if="isPending" kind="loading" />
    <PageState
      v-else-if="error"
      kind="error"
      :message="normalizeApiError(error).message"
      show-retry
      @retry="refetch()"
    />
    <p v-else-if="topics.length === 0" class="user-content-empty">没有主题</p>
    <ul v-else class="user-content-list">
      <li v-for="topic in topics" :key="topic.id">
        <div class="user-content-list__meta">
          <RouterLink v-if="topic.boardId" :to="`/list/${topic.boardId}`">
            {{ boardNames.get(topic.boardId) ?? topic.boardName ?? `版面 ${topic.boardId}` }}
          </RouterLink>
          <span v-else>未知版面</span>
          <time :datetime="topic.time">{{ formatTime(topic.time) }}</time>
        </div>
        <div class="user-favorite-topic__content">
          <RouterLink :to="`/topic/${topic.id}`" class="user-content-list__title">
            {{ topic.title?.trim() || "(无标题)" }}
          </RouterLink>
          <details v-if="topic.id != null" class="favorite-topic-actions">
            <summary>☷ 操作</summary>
            <div>
              <button type="button" :disabled="mutationPending" @click="removeTopic(topic.id)">
                取消收藏
              </button>
              <button type="button" :disabled="mutationPending" @click="openMoveDialog(topic.id)">
                移动分组
              </button>
            </div>
          </details>
        </div>
      </li>
    </ul>

    <Pagination
      v-if="!isPending && !error && (topics.length > 0 || page > 1)"
      :current-page="page"
      :has-next-page="hasNextPage"
      :to-page="filterPath"
      variant="user-center"
    />

    <UiDialog
      v-model:open="groupDialogOpen"
      title="收藏管理"
      confirm-label="确定"
      confirm-variant="primary"
      :pending="mutationPending"
      width-class="w-[min(40rem,calc(100vw-2rem))]"
      @confirm="submitGroupAction"
    >
      <nav class="favorite-group-tabs" aria-label="收藏分组管理">
        <button
          v-for="item in [
            ['create', '新增分组'],
            ['rename', '编辑分组'],
            ['delete', '删除分组'],
          ] as const"
          :key="item[0]"
          type="button"
          :class="{ 'is-active': groupAction === item[0] }"
          @click="groupAction = item[0]"
        >
          {{ item[1] }}
        </button>
      </nav>

      <div class="favorite-group-form">
        <template v-if="groupAction === 'create'">
          <label>
            <span>分组名称</span>
            <input v-model="createName" maxlength="10" :disabled="groupLimitReached" />
          </label>
          <p>目前支持的分组上限为 10 个，你已经创建了 {{ editableGroups.length }} 个分组。</p>
        </template>

        <template v-else-if="editableGroups.length === 0">
          <p>没有可供操作的收藏组</p>
          <p>默认分组不可删除或重命名</p>
        </template>

        <template v-else-if="groupAction === 'rename'">
          <label>
            <span>分组名称</span>
            <select v-model.number="selectedGroupId">
              <option v-for="group in editableGroups" :key="group.id" :value="group.id">
                {{ group.name }}（{{ group.count ?? 0 }}）
              </option>
            </select>
          </label>
          <label>
            <span>将名称修改为</span>
            <input v-model="renameName" maxlength="10" />
          </label>
        </template>

        <template v-else>
          <label>
            <span>分组名称</span>
            <select v-model.number="selectedGroupId">
              <option v-for="group in editableGroups" :key="group.id" :value="group.id">
                {{ group.name }}（{{ group.count ?? 0 }}）
              </option>
            </select>
          </label>
          <p>注意：删除后该分组将无法恢复，该分组下的所有收藏主题将移入默认分组。</p>
        </template>
      </div>
      <p v-if="notice" class="favorite-dialog-message" role="status">{{ notice }}</p>
    </UiDialog>

    <UiDialog
      v-model:open="moveDialogOpen"
      title="选择收藏分组"
      confirm-label="确认"
      confirm-variant="primary"
      :pending="moveFavorite.isPending.value"
      @confirm="moveTopic"
    >
      <select v-model.number="moveTargetGroupId" class="favorite-move-select">
        <option v-for="group in groups" :key="group.id" :value="group.id">
          {{ group.name }}（{{ group.count ?? 0 }}）
        </option>
      </select>
      <p v-if="notice" class="favorite-dialog-message" role="status">{{ notice }}</p>
    </UiDialog>
  </div>
</template>
