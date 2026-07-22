<script setup lang="ts">
import { computed, ref } from "vue";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/vue-query";
import { useTitle } from "@vueuse/core";
import {
  useDeleteUserContentMutation,
  useManageUserMutation,
  type UserOperationType,
  type UserPunishmentType,
} from "../../api/mutations";
import { boardsByIdsQuery, userByIdQuery, userModerationPostsQuery } from "../../api/queries";
import PageState from "../../components/PageState.vue";
import { normalizeApiError } from "../../lib/api-error";
import { parsePositiveInt } from "../../lib/route-params";
import { isSiteAdministrator, useUserStore } from "../../stores/user";
import { validateUserContentDays, validateUserManagementOperation } from "./form";

const props = defineProps<{ userId: string }>();
const PAGE_SIZE = 10;
const user = useUserStore();
const canManage = computed(() => isSiteAdministrator(user.user?.privilege));
const numericUserId = computed(() => parsePositiveInt(props.userId));
const authScope = computed(() => user.user?.id ?? "anonymous");
const profileQuery = useQuery(
  computed(() =>
    userByIdQuery(
      numericUserId.value ?? 0,
      authScope.value,
      canManage.value && numericUserId.value != null,
    ),
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
    canManage.value && inspectDays.value != null,
  ),
);
const postsQuery = useQuery(postsOptions);
const posts = computed(() => postsQuery.data.value?.postInfos ?? []);
const totalPages = computed(() =>
  Math.max(1, Math.ceil((postsQuery.data.value?.count ?? 0) / PAGE_SIZE)),
);
const boardIds = computed(() => posts.value.map((post) => post.boardId));
const boardQuery = useQuery(
  computed(() => boardsByIdsQuery(boardIds.value, canManage.value && posts.value.length > 0)),
);
const boardMap = computed(
  () => new Map((boardQuery.data.value ?? []).map((board) => [board.id, board])),
);

const profileError = computed(() =>
  profileQuery.error.value ? normalizeApiError(profileQuery.error.value) : null,
);
const pageState = computed(() => {
  if (!canManage.value) return "forbidden" as const;
  if (numericUserId.value == null) return "not-found" as const;
  if (profileQuery.isPending.value) return "loading" as const;
  if (profileError.value?.kind === "forbidden") return "forbidden" as const;
  if (profileError.value?.kind === "not-found") return "not-found" as const;
  if (profileError.value) return "error" as const;
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
      :message="pageState === 'forbidden' ? '只有论坛管理员可以管理用户。' : profileError?.message"
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

<style scoped>
.user-center-page {
  position: relative;
  width: 100%;
  min-height: 46.875rem;
  margin-top: -1.5rem;
  margin-bottom: 3rem;
  font-size: 0.88rem;
}

.user-center-page__title {
  margin: 0 0 1.25rem;
  color: var(--cc98-color-text);
  font-size: 1rem;
  font-weight: 400;
}

.user-center-shell {
  display: grid;
  grid-template-columns: 12.625rem minmax(0, 1fr);
  gap: 1.75rem;
  align-items: start;
}

.user-center-nav,
.user-center-main {
  border: 1px solid var(--cc98-color-border);
  background: var(--cc98-color-surface);
}

.user-center-nav {
  min-height: 40rem;
  padding: 0 0.625rem;
}

.user-center-nav ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.user-center-nav li + li {
  border-top: 1px dashed var(--cc98-color-border);
}

.user-center-nav a,
.user-center-nav a:visited {
  display: flex;
  height: 3.5rem;
  align-items: center;
  gap: 0.4rem;
  padding: 0 0.65rem;
  color: var(--cc98-color-text);
  text-decoration: none;
}

.user-center-nav a:hover,
.user-center-nav a.router-link-active,
.user-center-nav a.is-active {
  color: var(--cc98-color-primary);
}

.user-center-nav svg {
  width: 1.15rem;
  height: 1.15rem;
  flex: 0 0 auto;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.7;
}

.user-center-main {
  min-height: 40rem;
  padding: 2rem;
}

.user-manage-page {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.user-manage-panel {
  padding-bottom: 1.5rem;
  border-bottom: 1px dashed var(--cc98-color-border);
}

.user-manage-panel:last-child {
  border-bottom: 0;
}

.user-manage-panel h2 {
  margin: 0 0 1rem;
  color: var(--cc98-color-text);
  font-size: 1rem;
  font-weight: 500;
}

.user-manage-identity {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem 2rem;
  margin: 0;
}

.user-manage-identity div {
  display: grid;
  grid-template-columns: 5rem minmax(0, 1fr);
}

.user-manage-identity dt {
  color: var(--cc98-color-text-muted);
}

.user-manage-identity dd {
  margin: 0;
  color: var(--cc98-color-text);
}

.user-manager-form {
  display: grid;
  align-items: end;
  gap: 1rem;
}

.user-manager-form--operation {
  grid-template-columns: 8rem minmax(12rem, 1fr) 8rem auto;
}

.user-manager-form--compact {
  grid-template-columns: 10rem auto;
  justify-content: start;
}

.user-manager-form label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  color: var(--cc98-color-text-muted);
  font-size: 0.75rem;
}

.user-manager-form input,
.user-manager-form select {
  width: 100%;
  height: 2rem;
  padding: 0 0.5rem;
  border: 1px solid var(--cc98-color-border);
  background: var(--cc98-color-surface);
  color: var(--cc98-color-text);
  font: inherit;
}

.user-manager-form button,
.user-manage-posts button {
  min-width: 5rem;
  height: 2rem;
  padding: 0 0.75rem;
  border: 1px solid var(--cc98-color-primary);
  border-radius: 0.2rem;
  background: var(--cc98-color-primary);
  color: #fff;
  font: inherit;
  cursor: pointer;
}

.user-manager-form button:disabled,
.user-manage-posts button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.user-manager-form__actions {
  display: flex;
  gap: 0.75rem;
}

.user-manage-notice,
.user-manage-empty {
  margin: 0.75rem 0 0;
  color: var(--cc98-color-accent);
  font-size: 0.8rem;
}

.user-manage-empty {
  color: var(--cc98-color-text-muted);
}

.user-manage-posts {
  margin-top: 1rem;
  border-top: 1px solid var(--cc98-color-border);
}

.user-manage-posts article {
  display: grid;
  min-height: 3.25rem;
  grid-template-columns: 9.5rem minmax(0, 1fr) 6rem 3rem 7rem;
  align-items: center;
  gap: 0.75rem;
  border-bottom: 1px solid var(--cc98-color-border);
  color: var(--cc98-color-text-muted);
  font-size: 0.75rem;
}

.user-manage-posts article > a:first-of-type,
.user-manage-posts article > span:first-of-type {
  overflow: hidden;
  color: var(--cc98-color-text);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-manage-posts footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-top: 1rem;
  color: var(--cc98-color-text-muted);
  font-size: 0.75rem;
}

.user-manage-posts footer div {
  display: flex;
  gap: 0.75rem;
}

@media (max-width: 1000px) {
  .user-center-shell {
    grid-template-columns: 10rem minmax(0, 1fr);
    gap: 1rem;
  }

  .user-center-main {
    padding: 1.5rem;
  }
}
</style>
