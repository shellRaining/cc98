<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import { POST_CONTENT_TYPE, type PostContentType } from "@cc98/api";
import { computed } from "vue";
import { ZodError } from "zod";
import { topicPostsQuery } from "../api/queries";
import ContentRenderer from "../components/rich-content/ContentRenderer.vue";
import type { RichContentType } from "../components/rich-content/types";

const props = defineProps<{
  topicId: string;
  page?: string;
}>();

const pageNumber = computed(() => Math.max(1, Number.parseInt(props.page ?? "1", 10) || 1));
const numericTopicId = computed(() => Number.parseInt(props.topicId, 10) || 0);
const pageSize = 10;
const queryOptions = computed(() =>
  topicPostsQuery(numericTopicId.value, (pageNumber.value - 1) * pageSize, pageSize),
);
const { data: posts, error, isPending } = useQuery(queryOptions);
const showErrorDetail = import.meta.env.DEV;
const errorDetail = computed(() => {
  if (!error.value) return "";
  if (error.value instanceof ZodError) return JSON.stringify(error.value.issues, null, 2);
  if (error.value instanceof Error) return error.value.stack ?? error.value.message;
  return JSON.stringify(error.value, null, 2);
});

function getContentType(contentType: PostContentType): RichContentType {
  return contentType === POST_CONTENT_TYPE.markdown ? "markdown" : "ubb";
}
</script>

<template>
  <section class="space-y-4">
    <h1 class="text-2xl font-bold">帖子详情</h1>
    <p class="text-cc98-text-muted">topicId: {{ topicId }} · page: {{ pageNumber }}</p>

    <p v-if="isPending" class="text-sm text-cc98-text-muted">正在加载帖子内容…</p>
    <div v-else-if="error" class="rounded border border-red-300 bg-red-50 px-4 py-3 text-red-700">
      <p>帖子内容加载失败，请稍后重试。</p>
      <details v-if="showErrorDetail" class="mt-2 text-xs">
        <summary class="cursor-pointer">查看开发错误详情</summary>
        <pre class="mt-2 overflow-x-auto whitespace-pre-wrap">{{ errorDetail }}</pre>
      </details>
    </div>
    <p v-else-if="!posts?.length" class="text-sm text-cc98-text-muted">当前页没有帖子。</p>

    <ol v-else class="space-y-4">
      <li v-for="post in posts" :key="post.id">
        <article class="cc98-card overflow-hidden">
          <header
            class="flex flex-wrap items-center justify-between gap-2 border-b border-cc98-border px-4 py-3 text-sm"
          >
            <div>
              <strong>{{ post.isAnonymous ? "匿名用户" : (post.userName ?? "已注销用户") }}</strong>
              <span v-if="post.isLZ" class="ml-2 text-cc98-primary">楼主</span>
            </div>
            <div class="text-cc98-text-muted">#{{ post.floor }} · {{ post.time }}</div>
          </header>
          <div class="px-4 py-4">
            <ContentRenderer :content="post.content" :type="getContentType(post.contentType)" />
          </div>
        </article>
      </li>
    </ol>
  </section>
</template>
