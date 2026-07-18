<script setup lang="ts">
import dayjs from "dayjs";
import { useQuery } from "@tanstack/vue-query";
import { useTitle } from "@vueuse/core";
import { computed, ref, watch } from "vue";
import {
  useRefreshHomepageCacheMutation,
  useSaveSiteManageColumnMutation,
  useUpdateSiteAnnouncementMutation,
} from "../api/mutations";
import { siteManageColumnsQuery, siteManageGlobalConfigQuery } from "../api/queries";
import HomeAnnouncement from "../components/home/HomeAnnouncement.vue";
import PageState from "../components/PageState.vue";
import { normalizeApiError } from "../lib/api-error";
import {
  SITE_MANAGE_COLUMN_DEFINITIONS,
  SITE_MANAGE_COLUMN_KINDS,
  createSiteManageColumnDraft,
  isSiteAdministrator,
  normalizeSiteManageColumn,
  validateSiteManageColumn,
  type SiteManageColumnDraft,
  type SiteManageColumnKind,
} from "../lib/site-manage";
import { useUserStore } from "../stores/user";

const PAGE_SIZE = 10;
const user = useUserStore();
const canManage = computed(() => isSiteAdministrator(user.user?.privilege));
const announcement = ref("");
const activeKind = ref<SiteManageColumnKind | null>(null);
const drafts = ref<SiteManageColumnDraft[]>([]);
const currentPage = ref(1);
const notice = ref("");
const noticeKind = ref<"success" | "error">("success");
const savingRow = ref<string | null>(null);

useTitle("全站管理 - CC98 论坛");

const globalConfigQuery = useQuery(computed(() => siteManageGlobalConfigQuery(canManage.value)));
const columnsQuery = useQuery(
  computed(() =>
    siteManageColumnsQuery(
      activeKind.value ?? "recommendationReading",
      canManage.value && activeKind.value != null,
    ),
  ),
);
const updateAnnouncement = useUpdateSiteAnnouncementMutation();
const refreshHomepage = useRefreshHomepageCacheMutation();
const saveColumn = useSaveSiteManageColumnMutation();

watch(
  () => globalConfigQuery.data.value?.announcement,
  (value) => {
    if (value != null) announcement.value = value;
  },
  { immediate: true },
);

watch(
  [() => columnsQuery.data.value, activeKind],
  ([items, kind]) => {
    if (!items || !kind) return;
    drafts.value = items.map((item) => normalizeSiteManageColumn(item, kind));
    const pageCount = Math.max(1, Math.ceil(drafts.value.length / PAGE_SIZE));
    currentPage.value = Math.min(currentPage.value, pageCount);
  },
  { immediate: true },
);

const activeDefinition = computed(() =>
  activeKind.value ? SITE_MANAGE_COLUMN_DEFINITIONS[activeKind.value] : null,
);
const totalPages = computed(() => Math.max(1, Math.ceil(drafts.value.length / PAGE_SIZE)));
const tableColumnCount = computed(() => {
  const definition = activeDefinition.value;
  if (!definition) return 8;
  return (
    7 +
    Number(definition.hasContent) +
    Number(definition.hasImage) +
    Number(definition.hasOrderWeight) +
    Number(definition.hasDays) * 2
  );
});
const pageRows = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE;
  return drafts.value.slice(start, start + PAGE_SIZE).map((draft, offset) => ({
    draft,
    index: start + offset,
    key: draft.id == null ? `new-${start + offset}` : `saved-${draft.id}`,
  }));
});

function setNotice(message: string, kind: "success" | "error" = "success") {
  notice.value = message;
  noticeKind.value = kind;
}

async function submitAnnouncement() {
  try {
    await updateAnnouncement.mutateAsync(announcement.value);
    setNotice("修改全站公告成功");
  } catch (error) {
    setNotice(`修改全站公告失败：${normalizeApiError(error).message}`, "error");
  }
}

async function clearHomepageCache() {
  try {
    await refreshHomepage.mutateAsync();
    setNotice("清除首页缓存成功");
  } catch (error) {
    setNotice(`清除首页缓存失败：${normalizeApiError(error).message}`, "error");
  }
}

function selectKind(kind: SiteManageColumnKind) {
  activeKind.value = kind;
  currentPage.value = 1;
  drafts.value = [];
  notice.value = "";
}

function addColumn() {
  if (!activeKind.value) return;
  drafts.value.unshift(createSiteManageColumnDraft(activeKind.value));
  currentPage.value = 1;
}

async function saveRow(row: { draft: SiteManageColumnDraft; key: string }) {
  if (!activeKind.value) return;
  const validationMessage = validateSiteManageColumn(row.draft, activeKind.value);
  if (validationMessage) {
    setNotice(validationMessage, "error");
    return;
  }
  savingRow.value = row.key;
  try {
    await saveColumn.mutateAsync({ kind: activeKind.value, draft: row.draft });
    setNotice(row.draft.isNew ? "添加成功" : "修改成功");
  } catch (error) {
    setNotice(`保存失败：${normalizeApiError(error).message}`, "error");
  } finally {
    savingRow.value = null;
  }
}

function formatExpiredTime(value: string | null): string {
  if (!value) return "保存后生成";
  const date = dayjs(value);
  return date.isValid() ? date.format("YYYY-MM-DD HH:mm:ss") : value;
}
</script>

<template>
  <PageState v-if="!canManage" kind="forbidden" message="只有论坛管理员可以访问全站管理。" />
  <PageState v-else-if="globalConfigQuery.isPending.value" kind="loading" />
  <PageState
    v-else-if="globalConfigQuery.error.value"
    kind="error"
    :message="normalizeApiError(globalConfigQuery.error.value).message"
    show-retry
    @retry="globalConfigQuery.refetch()"
  />
  <section v-else class="site-manage-page">
    <h1>全站管理</h1>

    <p
      v-if="notice"
      class="site-manage-notice"
      :class="{ 'is-error': noticeKind === 'error' }"
      role="status"
    >
      {{ notice }}
    </p>
    <p v-else class="site-manage-notice" aria-hidden="true">&nbsp;</p>

    <section class="site-manage-announcement" aria-labelledby="site-announcement-title">
      <header>
        <h2 id="site-announcement-title">全站公告</h2>
        <button
          type="button"
          :disabled="updateAnnouncement.isPending.value"
          @click="submitAnnouncement"
        >
          {{ updateAnnouncement.isPending.value ? "提交中" : "提交修改" }}
        </button>
        <button
          type="button"
          :disabled="refreshHomepage.isPending.value"
          @click="clearHomepageCache"
        >
          {{ refreshHomepage.isPending.value ? "处理中" : "清除首页缓存" }}
        </button>
      </header>
      <label class="sr-only" for="site-announcement-editor">全站公告 UBB 内容</label>
      <textarea id="site-announcement-editor" v-model="announcement" rows="8" spellcheck="false" />
      <div class="site-manage-announcement__preview">
        <HomeAnnouncement :content="announcement" />
      </div>
    </section>

    <section class="site-manage-columns" aria-labelledby="site-columns-title">
      <header>
        <h2 id="site-columns-title">自定义栏目</h2>
        <button
          v-for="kind in SITE_MANAGE_COLUMN_KINDS"
          :key="kind"
          type="button"
          :class="{ 'is-active': activeKind === kind }"
          :disabled="activeKind === kind"
          @click="selectKind(kind)"
        >
          {{ SITE_MANAGE_COLUMN_DEFINITIONS[kind].label }}
        </button>
        <button v-if="activeKind" type="button" @click="addColumn">添加</button>
      </header>

      <PageState v-if="activeKind && columnsQuery.isPending.value" kind="loading" />
      <PageState
        v-else-if="activeKind && columnsQuery.error.value"
        kind="error"
        :message="normalizeApiError(columnsQuery.error.value).message"
        show-retry
        @retry="columnsQuery.refetch()"
      />
      <div v-else class="site-manage-table-wrap">
        <table class="site-manage-table">
          <thead>
            <tr>
              <th>id</th>
              <th>类型</th>
              <th>标题</th>
              <th v-if="activeDefinition?.hasContent">内容</th>
              <th>url</th>
              <th v-if="!activeDefinition || activeDefinition.hasImage">图片url</th>
              <th v-if="activeDefinition?.hasOrderWeight">排序权重</th>
              <th>有效</th>
              <th v-if="activeDefinition?.hasDays">天数</th>
              <th v-if="activeDefinition?.hasDays">过期时间</th>
              <th>可见性</th>
              <th>保存</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in pageRows" :key="row.key">
              <td>{{ row.draft.id ?? "新增" }}</td>
              <td>{{ activeDefinition?.label }}</td>
              <td>
                <input v-model="row.draft.title" type="text" aria-label="标题" />
              </td>
              <td v-if="activeDefinition?.hasContent">
                <input v-model="row.draft.content" type="text" aria-label="内容" />
              </td>
              <td>
                <input v-model="row.draft.url" type="text" aria-label="链接地址" />
              </td>
              <td v-if="activeDefinition?.hasImage">
                <input v-model="row.draft.imageUrl" type="text" aria-label="图片地址" />
              </td>
              <td v-if="activeDefinition?.hasOrderWeight">
                <input v-model.number="row.draft.orderWeight" type="number" aria-label="排序权重" />
              </td>
              <td>
                <input v-model="row.draft.enable" type="checkbox" aria-label="是否有效" />
              </td>
              <td v-if="activeDefinition?.hasDays">
                <input
                  v-model.number="row.draft.days"
                  type="number"
                  min="1"
                  step="1"
                  aria-label="有效天数"
                />
              </td>
              <td v-if="activeDefinition?.hasDays" class="site-manage-table__expired">
                {{ formatExpiredTime(row.draft.expiredTime) }}
              </td>
              <td>
                <select v-model.number="row.draft.visibility" aria-label="可见性">
                  <option :value="0">全部可见</option>
                  <option :value="1">仅登录用户</option>
                  <option :value="2">仅未登录用户</option>
                </select>
              </td>
              <td>
                <button type="button" :disabled="savingRow === row.key" @click="saveRow(row)">
                  {{ savingRow === row.key ? "保存中" : "保存" }}
                </button>
              </td>
            </tr>
            <tr v-if="pageRows.length === 0">
              <td :colspan="tableColumnCount" class="site-manage-table__empty">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>

      <nav v-if="activeKind && totalPages > 1" class="site-manage-pagination" aria-label="分页">
        <button
          type="button"
          :disabled="currentPage === 1"
          @click="currentPage = Math.max(1, currentPage - 1)"
        >
          上一页
        </button>
        <button
          v-for="page in totalPages"
          :key="page"
          type="button"
          :class="{ 'is-active': currentPage === page }"
          :aria-current="currentPage === page ? 'page' : undefined"
          @click="currentPage = page"
        >
          {{ page }}
        </button>
        <button
          type="button"
          :disabled="currentPage === totalPages"
          @click="currentPage = Math.min(totalPages, currentPage + 1)"
        >
          下一页
        </button>
      </nav>
    </section>
  </section>
</template>

<style scoped>
.site-manage-page {
  position: relative;
  left: 50%;
  width: min(90rem, calc(100vw - 2rem));
  min-height: 36rem;
  transform: translateX(-50%);
  padding: 0.75rem 1rem 1.5rem;
  background: var(--cc98-color-surface);
}

.site-manage-page > h1 {
  margin: 0;
  text-align: center;
  font-size: 1.5rem;
  font-weight: 400;
}

.site-manage-notice {
  min-height: 2rem;
  margin: 0.5rem 0;
  color: var(--cc98-color-success);
  font-size: 0.875rem;
}

.site-manage-notice.is-error {
  color: var(--cc98-color-error);
}

.site-manage-announcement > header,
.site-manage-columns > header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.9rem;
  margin-bottom: 1rem;
}

.site-manage-announcement h2,
.site-manage-columns h2 {
  margin: 0 0.25rem 0 0;
  font-size: 1.25rem;
  font-weight: 400;
}

.site-manage-page button {
  min-height: 2rem;
  padding: 0.25rem 0.9rem;
  border: 1px solid var(--cc98-color-primary);
  border-radius: var(--cc98-radius-sm);
  background: var(--cc98-color-primary);
  color: var(--cc98-color-on-primary);
  font: inherit;
  font-size: 0.875rem;
  cursor: pointer;
}

.site-manage-page button:hover:not(:disabled) {
  background: var(--cc98-color-primary-hover);
}

.site-manage-page button:disabled,
.site-manage-page button.is-active {
  opacity: 0.55;
  cursor: not-allowed;
}

.site-manage-announcement textarea {
  display: block;
  width: 100%;
  min-height: 12rem;
  resize: vertical;
  border: 1px solid var(--cc98-color-border);
  padding: 0.5rem 0.75rem;
  background: var(--cc98-color-surface);
  color: var(--cc98-color-text);
  font: inherit;
  line-height: 1.5;
}

.site-manage-announcement__preview {
  width: min(51.25rem, 100%);
  margin-top: 1rem;
}

.site-manage-announcement__preview :deep(.home-block) {
  margin-bottom: 0;
}

.site-manage-columns {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--cc98-color-border);
}

.site-manage-columns > header {
  justify-content: space-around;
}

.site-manage-table-wrap {
  width: 100%;
  overflow-x: auto;
}

.site-manage-table {
  width: 100%;
  min-width: 62rem;
  border-collapse: collapse;
  border: 1px solid var(--cc98-color-border);
  table-layout: fixed;
  font-size: 0.8125rem;
}

.site-manage-table th,
.site-manage-table td {
  border: 1px solid var(--cc98-color-border);
  padding: 0.5rem;
  text-align: center;
  vertical-align: middle;
}

.site-manage-table th {
  background: var(--cc98-color-surface-subtle);
  font-weight: 500;
}

.site-manage-table th:first-child,
.site-manage-table td:first-child {
  width: 4.25rem;
}

.site-manage-table input[type="text"],
.site-manage-table input[type="number"],
.site-manage-table select {
  width: 100%;
  min-height: 2rem;
  border: 1px solid var(--cc98-color-border);
  padding: 0.25rem 0.4rem;
  background: var(--cc98-color-surface);
  color: var(--cc98-color-text);
  font: inherit;
}

.site-manage-table input[type="checkbox"] {
  width: 1rem;
  height: 1rem;
}

.site-manage-table__expired {
  white-space: nowrap;
}

.site-manage-table__empty {
  height: 7rem;
  color: var(--cc98-color-text-muted);
}

.site-manage-pagination {
  display: flex;
  justify-content: flex-end;
  gap: 0.4rem;
  margin-top: 0.75rem;
}

.site-manage-pagination button {
  min-width: 2rem;
  padding-inline: 0.5rem;
}

@media (max-width: 72rem) {
  .site-manage-page {
    padding-inline: 0.75rem;
  }

  .site-manage-announcement > header,
  .site-manage-columns > header {
    flex-wrap: wrap;
  }
}
</style>
