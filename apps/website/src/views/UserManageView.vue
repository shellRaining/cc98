<script setup lang="ts">
import { computed, ref } from "vue";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/vue-query";
import { useTitle } from "@vueuse/core";
import { useDeleteUserContentMutation, useManageUserMutation } from "../api/mutations";
import { boardsByIdsQuery, userByIdQuery, userModerationPostsQuery } from "../api/queries";
import PageState from "../components/PageState.vue";
import { normalizeApiError } from "../lib/api-error";
import { parsePositiveInt } from "../lib/route-params";
import {
  validateUserContentDays,
  validateUserManagementOperation,
  type UserOperationType,
  type UserPunishmentType,
} from "../lib/user-management";
import { useUserStore } from "../stores/user";

const props = defineProps<{ userId: string }>();
const PAGE_SIZE = 10;
const user = useUserStore();
const numericUserId = computed(() => parsePositiveInt(props.userId));
const authScope = computed(() => user.user?.id ?? "anonymous");
const profileQuery = useQuery(
  computed(() =>
    userByIdQuery(numericUserId.value ?? 0, authScope.value, numericUserId.value != null),
  ),
);
const profile = computed(() => profileQuery.data.value ?? null);
useTitle(computed(() => `${profile.value?.name ?? "用户"} - 用户管理 - CC98 论坛`));

const punishmentType = ref<UserPunishmentType>(3);
const punishmentReason = ref("");
const punishmentDays = ref(7);
const operationNotice = ref("");
const manageUserMutation = useManageUserMutation();

const deleteDays = ref(1);
const deleteNotice = ref("");
const deleteMutation = useDeleteUserContentMutation();

const inspectDaysInput = ref(1);
const inspectDays = ref<number | null>(null);
const inspectPage = ref(1);
const inspectNotice = ref("");
const postsOptions = computed(() =>
  userModerationPostsQuery(
    numericUserId.value ?? 0,
    inspectDays.value ?? 0,
    (inspectPage.value - 1) * PAGE_SIZE,
    PAGE_SIZE,
    authScope.value,
    inspectDays.value != null,
  ),
);
const postsQuery = useQuery(postsOptions);
const posts = computed(() => postsQuery.data.value?.postInfos ?? []);
const totalPages = computed(() =>
  Math.max(1, Math.ceil((postsQuery.data.value?.count ?? 0) / PAGE_SIZE)),
);
const boardIds = computed(() => posts.value.map((post) => post.boardId));
const boardQuery = useQuery(
  computed(() => boardsByIdsQuery(boardIds.value, posts.value.length > 0)),
);
const boardMap = computed(
  () => new Map((boardQuery.data.value ?? []).map((board) => [board.id, board])),
);

const pageState = computed(() => {
  if (numericUserId.value == null) return "not-found" as const;
  if (profileQuery.isPending.value) return "loading" as const;
  if (profileQuery.error.value) return normalizeApiError(profileQuery.error.value).kind;
  if (!profile.value) return "not-found" as const;
  return null;
});

async function submitOperation(operationType: UserOperationType) {
  if (numericUserId.value == null) return;
  const request = {
    userId: numericUserId.value,
    punishmentType: punishmentType.value,
    operationType,
    reason: punishmentReason.value,
    days: punishmentDays.value,
  };
  const validationError = validateUserManagementOperation(request);
  if (validationError) return void (operationNotice.value = validationError);
  operationNotice.value = "";
  try {
    await manageUserMutation.mutateAsync(request);
    operationNotice.value = operationType === 1 ? "处罚操作已提交" : "解除操作已提交";
  } catch (error) {
    operationNotice.value = normalizeApiError(error, {
      forbiddenMessage: "你没有管理用户的权限",
    }).message;
  }
}

async function removeContent(kind: "topic" | "post") {
  if (numericUserId.value == null) return;
  const validationError = validateUserContentDays(deleteDays.value);
  if (validationError) return void (deleteNotice.value = validationError);
  deleteNotice.value = "";
  try {
    const count = await deleteMutation.mutateAsync({
      userId: numericUserId.value,
      kind,
      days: deleteDays.value,
    });
    deleteNotice.value = `已删除 ${count} 条${kind === "topic" ? "主题" : "回复"}`;
    if (inspectDays.value != null) inspectPage.value = 1;
  } catch (error) {
    deleteNotice.value = normalizeApiError(error, {
      forbiddenMessage: "你没有批量删除用户内容的权限",
    }).message;
  }
}

function inspectPosts() {
  const validationError = validateUserContentDays(inspectDaysInput.value);
  if (validationError) return void (inspectNotice.value = validationError);
  inspectNotice.value = "";
  inspectPage.value = 1;
  inspectDays.value = inspectDaysInput.value;
}

function formatTime(value: string) {
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD HH:mm:ss") : value;
}
</script>

<template>
  <section class="user-center-page user-detail-page">
    <h1 class="user-center-page__title">用户管理</h1>
    <PageState
      v-if="pageState"
      :kind="pageState"
      :message="
        profileQuery.error.value ? normalizeApiError(profileQuery.error.value).message : undefined
      "
      :show-retry="pageState === 'error'"
      @retry="profileQuery.refetch()"
    />

    <div v-else-if="profile" class="user-center-shell">
      <nav class="user-center-nav user-detail-nav" aria-label="用户详情">
        <ul>
          <li>
            <RouterLink :to="`/user/id/${profile.id}`"><span>主页</span></RouterLink>
          </li>
          <li>
            <RouterLink :to="`/user/id/${profile.id}/manage`" class="is-active"
              ><span>管理</span></RouterLink
            >
          </li>
        </ul>
      </nav>

      <main class="user-center-main user-manage-page">
        <section class="user-manage-panel">
          <h2>用户信息</h2>
          <dl class="user-manage-identity">
            <div>
              <dt>ID</dt>
              <dd>{{ profile.id }}</dd>
            </div>
            <div>
              <dt>用户名</dt>
              <dd>{{ profile.name }}</dd>
            </div>
            <div>
              <dt>用户组</dt>
              <dd>{{ profile.privilege }}</dd>
            </div>
            <div>
              <dt>账号状态</dt>
              <dd>{{ profile.lockState }}</dd>
            </div>
          </dl>
        </section>

        <section class="user-manage-panel">
          <h2>全站处罚</h2>
          <div class="user-manager-form user-manager-form--operation">
            <label
              ><span>类型</span
              ><select v-model.number="punishmentType">
                <option :value="1">锁定</option>
                <option :value="2">屏蔽</option>
                <option :value="3">TP</option>
              </select></label
            >
            <label
              ><span>理由</span><input v-model.trim="punishmentReason" type="text" maxlength="200"
            /></label>
            <label
              ><span>天数</span
              ><input v-model.number="punishmentDays" type="number" min="-1" max="1000"
            /></label>
            <div class="user-manager-form__actions">
              <button
                type="button"
                :disabled="manageUserMutation.isPending.value"
                @click="submitOperation(1)"
              >
                提交
              </button>
              <button
                type="button"
                :disabled="manageUserMutation.isPending.value"
                @click="submitOperation(0)"
              >
                解除
              </button>
            </div>
          </div>
          <p v-if="operationNotice" class="user-manage-notice">{{ operationNotice }}</p>
        </section>

        <section class="user-manage-panel">
          <h2>删除最近主题与回复</h2>
          <div class="user-manager-form user-manager-form--compact">
            <label
              ><span>天数</span><input v-model.number="deleteDays" type="number" min="1" max="365"
            /></label>
            <div class="user-manager-form__actions">
              <button
                type="button"
                :disabled="deleteMutation.isPending.value"
                @click="removeContent('topic')"
              >
                删主题
              </button>
              <button
                type="button"
                :disabled="deleteMutation.isPending.value"
                @click="removeContent('post')"
              >
                删回复
              </button>
            </div>
          </div>
          <p v-if="deleteNotice" class="user-manage-notice">{{ deleteNotice }}</p>
        </section>

        <section class="user-manage-panel">
          <h2>查看用户最近发言</h2>
          <div class="user-manager-form user-manager-form--compact">
            <label
              ><span>天数</span
              ><input v-model.number="inspectDaysInput" type="number" min="1" max="365"
            /></label>
            <button type="button" @click="inspectPosts">查看</button>
          </div>
          <p v-if="inspectNotice" class="user-manage-notice">{{ inspectNotice }}</p>
          <p v-if="postsQuery.isPending.value && inspectDays != null" class="user-manage-empty">
            正在加载发言…
          </p>
          <p v-else-if="postsQuery.error.value" class="user-manage-notice">
            {{ normalizeApiError(postsQuery.error.value).message }}
          </p>
          <p v-else-if="inspectDays != null && posts.length === 0" class="user-manage-empty">
            啥也没有
          </p>
          <div v-else-if="posts.length" class="user-manage-posts">
            <article v-for="post in posts" :key="`${post.topicId}-${post.floor}-${post.time}`">
              <time>{{ formatTime(post.time) }}</time>
              <RouterLink
                v-if="post.floor !== -1"
                :to="`/topic/${post.topicId}/${Math.floor((post.floor - 1) / 10) + 1}#floor-${post.floor}`"
                >{{ post.content }}</RouterLink
              >
              <span v-else>{{ post.content }}</span>
              <RouterLink :to="`/list/${post.boardId}`">{{
                boardMap.get(post.boardId)?.name ?? `版面 ${post.boardId}`
              }}</RouterLink>
              <span>{{ post.floor === -1 ? "已删除" : post.floor }}</span>
              <span>{{ post.ip }}</span>
            </article>
            <footer>
              <span
                >共 {{ postsQuery.data.value?.count ?? 0 }} 条，第 {{ inspectPage }} /
                {{ totalPages }} 页</span
              >
              <div>
                <button type="button" :disabled="inspectPage <= 1" @click="inspectPage -= 1">
                  上一页</button
                ><button
                  type="button"
                  :disabled="inspectPage >= totalPages"
                  @click="inspectPage += 1"
                >
                  下一页
                </button>
              </div>
            </footer>
          </div>
        </section>
      </main>
    </div>
  </section>
</template>
