<script setup lang="ts">
import { computed } from "vue";
import { POST_CONTENT_TYPE, type Post, type PostContentType } from "@cc98/api";
import dayjs from "dayjs";
import ContentRenderer from "./rich-content/ContentRenderer.vue";
import type { RichContentType } from "./rich-content/types";
import { floorAnchorId } from "../lib/route-params";

const props = defineProps<{
  post: Post;
}>();

const floor = computed(() => props.post.floor ?? 0);
const anchorId = computed(() => floorAnchorId(floor.value));
const author = computed(() => {
  if (props.post.isAnonymous) return "匿名用户";
  return props.post.userName?.trim() || "已注销用户";
});
const timeText = computed(() => {
  const value = props.post.time;
  if (!value) return "—";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD HH:mm") : value;
});
const deleted = computed(() => props.post.isDeleted === true);
const title = computed(() => props.post.title?.trim() || "");

function getContentType(contentType: PostContentType | undefined): RichContentType {
  return contentType === POST_CONTENT_TYPE.markdown ? "markdown" : "ubb";
}
</script>

<template>
  <article :id="anchorId" class="cc98-card overflow-hidden scroll-mt-16">
    <header
      class="flex flex-wrap items-center justify-between gap-2 border-b border-cc98-border px-4 py-3 text-sm"
    >
      <div>
        <strong>{{ author }}</strong>
        <span v-if="post.isLZ" class="ml-2 text-cc98-primary">楼主</span>
      </div>
      <div class="text-cc98-text-muted">
        <a :href="`#${anchorId}`" class="cc98-link">#{{ floor }}</a>
        · {{ timeText }}
      </div>
    </header>
    <div class="px-4 py-4 space-y-3">
      <p v-if="deleted" class="text-sm text-cc98-text-muted">该楼层已删除或不可见。</p>
      <template v-else>
        <h3 v-if="title" class="text-base font-medium">{{ title }}</h3>
        <ContentRenderer :content="post.content ?? ''" :type="getContentType(post.contentType)" />
      </template>
    </div>
  </article>
</template>
