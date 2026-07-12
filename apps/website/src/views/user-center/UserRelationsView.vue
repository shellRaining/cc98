<script setup lang="ts">
import type { BasicUser } from "@cc98/api";
import { computed, ref } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { RouterLink, useRoute } from "vue-router";
import { useUnfollowUserMutation } from "../../api/mutations";
import { currentUserQuery, meRelationIdsQuery, usersByIdsQuery } from "../../api/queries";
import ConfirmDialog from "../../components/ConfirmDialog.vue";
import PageState from "../../components/PageState.vue";
import Pagination from "../../components/Pagination.vue";
import { normalizeApiError } from "../../lib/api-error";
import { pageToFrom } from "../../lib/route-params";
import {
  pageCount,
  parseUserCenterPage,
  type MeRelationKind,
  userCenterPagePath,
} from "../../lib/user-center";
import { useUserStore } from "../../stores/user";

const PAGE_SIZE = 10;
const route = useRoute();
const user = useUserStore();
const page = computed(() => parseUserCenterPage(route.query.page));
const kind = computed<MeRelationKind>(() =>
  route.meta.relationKind === "followers" ? "followers" : "following",
);
const title = computed(() => (kind.value === "following" ? "关注用户" : "我的粉丝"));
const authScope = computed(() => user.user?.id ?? "anonymous");
const { data: me } = useQuery(currentUserQuery);
const relationOptions = computed(() =>
  meRelationIdsQuery(kind.value, authScope.value, pageToFrom(page.value, PAGE_SIZE), PAGE_SIZE),
);
const { data: ids, error, isPending, refetch } = useQuery(relationOptions);
const userOptions = computed(() => usersByIdsQuery(ids.value ?? [], (ids.value?.length ?? 0) > 0));
const { data: users, isPending: usersPending, error: usersError } = useQuery(userOptions);
const rows = computed<Array<BasicUser & { id: number }>>(() => {
  const byId = new Map((users.value ?? []).map((item) => [item.id, item]));
  return (ids.value ?? []).map((id) => byId.get(id) ?? { id, name: "用户信息不可用" });
});
const totalPages = computed(() =>
  pageCount(kind.value === "following" ? me.value?.followCount : me.value?.fanCount, PAGE_SIZE),
);
const unfollow = useUnfollowUserMutation();
const notice = ref("");

async function unfollowUser(userId: number) {
  try {
    await unfollow.mutateAsync(userId);
    notice.value = "已取消关注";
  } catch (mutationError) {
    notice.value = normalizeApiError(mutationError).message;
  }
}
</script>

<template>
  <div class="space-y-4">
    <header>
      <h1 class="text-2xl font-bold">{{ title }}</h1>
      <p class="mt-1 text-sm text-cc98-text-muted">
        {{ kind === "following" ? "查看并管理已经关注的用户。" : "查看关注你的用户。" }}
      </p>
    </header>
    <p v-if="notice" class="text-sm text-cc98-text-muted" role="status">{{ notice }}</p>
    <PageState v-if="isPending || usersPending" kind="loading" />
    <PageState
      v-else-if="error || usersError"
      kind="error"
      :message="normalizeApiError(error || usersError).message"
      show-retry
      @retry="refetch()"
    />
    <PageState v-else-if="rows.length === 0" kind="empty" />
    <template v-else-if="rows.length > 0">
      <ul class="cc98-card m-0 list-none divide-y divide-cc98-border px-4">
        <li
          v-for="relationUser in rows"
          :key="relationUser.id"
          class="flex items-center gap-3 py-4"
        >
          <img
            v-if="relationUser.portraitUrl"
            :src="relationUser.portraitUrl"
            alt=""
            class="h-10 w-10 rounded-full object-cover"
            loading="lazy"
          />
          <div v-else class="h-10 w-10 rounded-full bg-cc98-border" aria-hidden="true" />
          <div class="min-w-0 flex-1">
            <RouterLink :to="`/user/id/${relationUser.id}`" class="cc98-link font-medium">
              {{ relationUser.name }}
            </RouterLink>
          </div>
          <ConfirmDialog
            v-if="kind === 'following'"
            title="取消关注"
            :description="`确定不再关注 ${relationUser.name} 吗？`"
            trigger-label="取消关注"
            :pending="unfollow.isPending.value"
            :disabled="unfollow.isPending.value"
            @confirm="unfollowUser(relationUser.id)"
          />
        </li>
      </ul>
    </template>
    <Pagination
      v-if="!isPending && !usersPending && !error && !usersError && (rows.length > 0 || page > 1)"
      :current-page="page"
      :total-pages="totalPages"
      :to-page="
        (target) =>
          userCenterPagePath(
            kind === 'following' ? '/usercenter/following' : '/usercenter/followers',
            target,
          )
      "
    />
  </div>
</template>
