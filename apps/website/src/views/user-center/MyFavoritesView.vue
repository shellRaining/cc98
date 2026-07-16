<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { useRoute, useRouter } from "vue-router";
import {
  useCreateFavoriteGroupMutation,
  useDeleteFavoriteGroupMutation,
  useMoveFavoriteMutation,
  useRemoveFavoriteMutation,
  useRenameFavoriteGroupMutation,
} from "../../api/mutations";
import { meFavoriteGroupsQuery, meFavoritesQuery } from "../../api/queries";
import ConfirmDialog from "../../components/ConfirmDialog.vue";
import PageState from "../../components/PageState.vue";
import Pagination from "../../components/Pagination.vue";
import TopicList from "../../components/TopicList.vue";
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
const createName = ref("");
const renameId = ref(0);
const renameName = ref("");
const deleteId = ref(0);
const notice = ref("");

watch(keyword, (value) => (draftKeyword.value = value));

const groupOptions = computed(() => meFavoriteGroupsQuery(authScope.value));
const { data: groupPage, error: groupError, refetch: refetchGroups } = useQuery(groupOptions);
const groups = computed(() => groupPage.value?.data ?? []);
const editableGroups = computed(() => groups.value.filter((group) => (group.id ?? 0) > 0));

watch(
  editableGroups,
  (value) => {
    const firstId = value[0]?.id ?? 0;
    if (!value.some((group) => group.id === renameId.value)) renameId.value = firstId;
    if (!value.some((group) => group.id === deleteId.value)) deleteId.value = firstId;
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

async function createFavoriteGroup() {
  const name = createName.value.trim();
  if (!name || name.length > 10) {
    notice.value = "分组名称需要填写 1 至 10 个字符";
    return;
  }
  try {
    await createGroup.mutateAsync(name);
    createName.value = "";
    notice.value = "收藏分组已创建";
  } catch (mutationError) {
    notice.value = normalizeApiError(mutationError).message;
  }
}

async function renameFavoriteGroup() {
  const name = renameName.value.trim();
  if (renameId.value <= 0 || !name || name.length > 10) {
    notice.value = "请选择分组，并填写 1 至 10 个字符的新名称";
    return;
  }
  try {
    await renameGroup.mutateAsync({ id: renameId.value, name });
    renameName.value = "";
    notice.value = "收藏分组已重命名";
  } catch (mutationError) {
    notice.value = normalizeApiError(mutationError).message;
  }
}

async function deleteFavoriteGroup() {
  if (deleteId.value <= 0) return;
  const deletedId = deleteId.value;
  try {
    await deleteGroup.mutateAsync(deletedId);
    if (groupId.value === deletedId) {
      await router.push(
        userCenterPagePath("/usercenter/favorites", 1, { group: 0, order: order.value }),
      );
    }
    notice.value = "收藏分组已删除，原有主题已移入默认分组";
  } catch (mutationError) {
    notice.value = normalizeApiError(mutationError).message;
  }
}

async function moveTopic(topicId: number, event: Event) {
  const target = Number((event.target as HTMLSelectElement).value);
  if (!Number.isSafeInteger(target) || target < 0) return;
  try {
    await moveFavorite.mutateAsync({ topicId, groupId: target });
    notice.value = "收藏主题已移动";
  } catch (mutationError) {
    notice.value = normalizeApiError(mutationError).message;
  }
}

async function removeTopic(topicId: number) {
  try {
    await removeFavorite.mutateAsync(topicId);
    notice.value = "已移出收藏";
  } catch (mutationError) {
    notice.value = normalizeApiError(mutationError).message;
  }
}
</script>

<template>
  <div class="space-y-5">
    <header>
      <h1 class="text-2xl font-bold">我的收藏</h1>
      <p class="mt-1 text-sm text-cc98-text-muted">筛选收藏主题，并管理收藏分组。</p>
    </header>

    <section class="cc98-card p-4 space-y-4" aria-labelledby="favorite-groups-title">
      <h2 id="favorite-groups-title" class="font-semibold">收藏分组</h2>
      <div class="grid gap-3 lg:grid-cols-3">
        <form class="flex gap-2" @submit.prevent="createFavoriteGroup">
          <input
            v-model="createName"
            maxlength="10"
            placeholder="新分组名称"
            class="min-w-0 flex-1 cc98-input text-sm"
          />
          <button class="cc98-btn px-3 py-2 text-sm" :disabled="mutationPending">新增</button>
        </form>
        <form class="flex gap-2" @submit.prevent="renameFavoriteGroup">
          <select v-model.number="renameId" class="min-w-0 cc98-input px-2 text-sm">
            <option :value="0">选择分组</option>
            <option v-for="group in editableGroups" :key="group.id" :value="group.id">
              {{ group.name }}
            </option>
          </select>
          <input
            v-model="renameName"
            maxlength="10"
            placeholder="新名称"
            class="min-w-0 flex-1 cc98-input text-sm"
          />
          <button
            class="rounded border border-cc98-border px-3 py-2 text-sm"
            :disabled="mutationPending"
          >
            重命名
          </button>
        </form>
        <div class="flex items-center gap-2">
          <select v-model.number="deleteId" class="min-w-0 flex-1 cc98-input px-2 py-2 text-sm">
            <option :value="0">选择分组</option>
            <option v-for="group in editableGroups" :key="group.id" :value="group.id">
              {{ group.name }}
            </option>
          </select>
          <ConfirmDialog
            title="删除收藏分组"
            description="分组删除后无法恢复，其中的收藏主题会移入默认分组。"
            trigger-label="删除"
            confirm-label="确认删除"
            :disabled="deleteId <= 0 || mutationPending"
            :pending="deleteGroup.isPending.value"
            @confirm="deleteFavoriteGroup"
          />
        </div>
      </div>
      <p v-if="groupError" class="text-sm text-cc98-error">
        {{ normalizeApiError(groupError).message }}
        <button class="cc98-link ml-2" @click="refetchGroups()">重试</button>
      </p>
      <p v-if="notice" class="text-sm text-cc98-text-muted" role="status">{{ notice }}</p>
    </section>

    <form class="cc98-card p-4 flex flex-wrap items-end gap-3" @submit.prevent="submitSearch">
      <label class="text-sm text-cc98-text-muted">
        分组
        <select
          :value="groupId"
          class="ml-2 cc98-input px-2 py-1.5"
          :disabled="Boolean(keyword)"
          @change="
            updateFilter({ group: Number(($event.target as HTMLSelectElement).value), keyword: '' })
          "
        >
          <option v-for="group in groups" :key="group.id" :value="group.id">
            {{ group.name }}（{{ group.count ?? 0 }}）
          </option>
        </select>
      </label>
      <label class="text-sm text-cc98-text-muted">
        排序
        <select
          :value="order"
          class="ml-2 cc98-input px-2 py-1.5"
          :disabled="Boolean(keyword)"
          @change="
            updateFilter({ order: Number(($event.target as HTMLSelectElement).value), keyword: '' })
          "
        >
          <option :value="0">发帖时间</option>
          <option :value="1">最后回复</option>
          <option :value="2">收藏时间</option>
        </select>
      </label>
      <label class="min-w-[14rem] flex-1 text-sm text-cc98-text-muted">
        搜索收藏
        <input
          v-model="draftKeyword"
          class="mt-1 w-full cc98-input px-3 py-1.5 text-cc98-text"
          placeholder="输入关键词"
        />
      </label>
      <button class="cc98-btn px-4 py-1.5 text-sm">搜索</button>
      <button
        v-if="keyword"
        type="button"
        class="cc98-link text-sm"
        @click="
          draftKeyword = '';
          updateFilter({ group: 0, order: 0, keyword: '' });
        "
      >
        清除搜索
      </button>
    </form>

    <PageState v-if="isPending" kind="loading" />
    <PageState
      v-else-if="error"
      kind="error"
      :message="normalizeApiError(error).message"
      show-retry
      @retry="refetch()"
    />
    <PageState v-else-if="topics.length === 0" kind="empty" message="没有符合条件的收藏主题。" />
    <template v-else-if="topics.length > 0">
      <div class="cc98-card px-4">
        <TopicList :topics="topics">
          <template #item="{ topic }">
            <div v-if="topic.id != null" class="mt-2 flex flex-wrap items-center gap-3 text-sm">
              <label class="text-cc98-text-muted">
                移动到
                <select
                  class="ml-1 cc98-input px-2 py-1"
                  value=""
                  :disabled="mutationPending"
                  @change="moveTopic(topic.id, $event)"
                >
                  <option value="" disabled>选择分组</option>
                  <option v-for="group in groups" :key="group.id" :value="group.id">
                    {{ group.name }}
                  </option>
                </select>
              </label>
              <ConfirmDialog
                title="移出收藏"
                description="该主题会从收藏列表中移除。"
                trigger-label="移出收藏"
                confirm-label="确认移除"
                :pending="removeFavorite.isPending.value"
                :disabled="mutationPending"
                @confirm="removeTopic(topic.id)"
              />
            </div>
          </template>
        </TopicList>
      </div>
    </template>
    <Pagination
      v-if="!isPending && !error && (topics.length > 0 || page > 1)"
      :current-page="page"
      :has-next-page="hasNextPage"
      :to-page="filterPath"
    />
  </div>
</template>
