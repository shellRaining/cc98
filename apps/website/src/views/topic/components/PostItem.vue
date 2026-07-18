<script setup lang="ts">
import { computed } from "vue";
import { POST_CONTENT_TYPE, type Post, type PostContentType, type User } from "@cc98/api";
import dayjs from "dayjs";
import PostActions from "./PostActions.vue";
import UiButton from "../../../components/ui/Button.vue";
import ContentRenderer from "../../../components/rich-content/ContentRenderer.vue";
import type { RichContentType } from "../../../components/rich-content/types";
import { floorAnchorId } from "../../../lib/route-params";
import FramedAvatar from "../../../components/user/FramedAvatar.vue";

const props = defineProps<{
  post: Post;
  user?: User;
  hot?: boolean;
  canManage?: boolean;
}>();
const emit = defineEmits<{
  reply: [post: Post];
  filterUser: [post: Post];
  trace: [post: Post];
  manage: [post: Post];
}>();

const floor = computed(() => props.post.floor ?? 0);
const anchorId = computed(() => floorAnchorId(floor.value));
const anonymousName = computed(() => {
  const suffix = props.post.userName?.trim();
  return suffix ? `匿名${suffix.toUpperCase()}` : "匿名用户";
});
const author = computed(() => {
  if (props.post.isAnonymous) return anonymousName.value;
  return props.user?.name || props.post.userName?.trim() || "已注销用户";
});
const authorLink = computed(() => {
  if (props.post.isAnonymous || props.post.userId == null) return null;
  return `/user/id/${props.post.userId}`;
});
const avatar = computed(() => {
  if (props.post.isAnonymous) return "/static/images/心灵头像.gif";
  return props.user?.portraitUrl || props.user?.photourl || "/static/images/_CC98.png";
});
const timeText = computed(() => formatTime(props.post.time));
const lastUpdateText = computed(() => {
  if (!props.post.lastUpdateAuthor || !props.post.lastUpdateTime) return null;
  const editor =
    props.post.lastUpdateAuthor === author.value ? "作者" : props.post.lastUpdateAuthor;
  return `该帖最后由 ${editor} 在 ${formatTime(props.post.lastUpdateTime)} 编辑`;
});
const deleted = computed(() => props.post.isDeleted === true);
const title = computed(() => props.post.title?.trim() || "");

function formatTime(value: string | null | undefined): string {
  if (!value) return "—";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD HH:mm:ss") : value;
}

function getContentType(contentType: PostContentType | undefined): RichContentType {
  return contentType === POST_CONTENT_TYPE.markdown ? "markdown" : "ubb";
}
</script>

<template>
  <article :id="anchorId" class="topic-post" :class="{ 'topic-post--hot': hot }">
    <aside class="topic-post__user">
      <div class="topic-post__user-copy">
        <RouterLink v-if="authorLink" :to="authorLink" class="topic-post__username">{{
          author
        }}</RouterLink>
        <strong v-else class="topic-post__username">{{ author }}</strong>
        <span v-if="hot" class="topic-post__hot-label">最热回复（第 {{ floor }} 楼）</span>
        <span v-if="post.isAnonymous" class="topic-post__anonymous">别问我是谁</span>
        <template v-else>
          <span>帖数 {{ user?.postCount ?? 0 }}</span>
          <span>粉丝 {{ user?.fanCount ?? 0 }}</span>
          <span>威望 {{ user?.prestige ?? 0 }}</span>
          <span>{{ user?.levelTitle || user?.privilege || "普通用户" }}</span>
        </template>
      </div>
      <div class="topic-post__portrait">
        <span v-if="!post.isAnonymous" class="topic-post__gender">{{
          user?.gender === 0 ? "♀" : "♂"
        }}</span>
        <FramedAvatar
          :src="avatar"
          :alt="post.isAnonymous ? '匿名用户头像' : `${author} 的头像`"
          :display-title-id="post.isAnonymous ? null : user?.displayTitleId"
          :to="authorLink"
          :fallback="
            post.isAnonymous
              ? '/static/images/心灵头像.gif'
              : '/static/images/default_avatar_boy.png'
          "
        />
        <div v-if="authorLink" class="topic-post__user-actions">
          <RouterLink :to="authorLink">资料</RouterLink>
          <RouterLink :to="`/messages/private/${post.userId}`">私信</RouterLink>
        </div>
      </div>
    </aside>

    <div class="topic-post__main">
      <div class="topic-post__content">
        <slot name="before-content" />
        <p v-if="deleted" class="topic-post__deleted">该楼层已删除或不可见。</p>
        <template v-else>
          <h2 v-if="title">{{ title }}</h2>
          <ContentRenderer :content="post.content ?? ''" :type="getContentType(post.contentType)" />
        </template>
      </div>

      <div v-if="post.awards?.length" class="topic-post__awards">
        本楼获得 {{ post.awards.length }} 项奖励
      </div>

      <footer v-if="!deleted && post.id != null" class="topic-post__footer">
        <div>
          <span>发表于 {{ timeText }}</span>
          <span v-if="lastUpdateText">{{ lastUpdateText }}</span>
        </div>
        <div class="topic-post__operations">
          <PostActions :post="post" />
          <UiButton variant="text" type="button" @click="emit('reply', post)">引用</UiButton>
          <UiButton
            v-if="!post.isAnonymous && post.userId"
            variant="text"
            type="button"
            @click="emit('filterUser', post)"
          >
            只看此人
          </UiButton>
          <UiButton variant="text" type="button" @click="emit('trace', post)">追踪</UiButton>
          <RouterLink
            v-if="post.isMe"
            :to="{ name: 'edit-post', params: { postId: String(post.id) } }"
            class="topic-post__operation-link"
          >
            编辑
          </RouterLink>
          <UiButton v-if="canManage" variant="text" type="button" @click="emit('manage', post)">
            管理
          </UiButton>
        </div>
      </footer>

      <div v-if="user?.signatureCode && !post.isAnonymous" class="topic-post__signature">
        <ContentRenderer type="ubb" :content="user.signatureCode" />
      </div>
    </div>

    <a
      :href="`#${anchorId}`"
      class="topic-post__floor"
      :class="{ 'topic-post__floor--hot': hot }"
      :title="hot ? '最热回复' : `第 ${floor} 楼`"
    >
      {{ hot ? "热" : floor }}
    </a>
    <span v-if="post.isLZ && floor > 1 && !hot" class="topic-post__floor topic-post__floor--lz">
      楼主
    </span>
  </article>
</template>

<style scoped>
.topic-post {
  position: relative;
  display: grid;
  width: 100%;
  min-height: 16rem;
  grid-template-columns: 15.5rem minmax(0, 1fr);
  margin-top: 1rem;
  border: 2px solid var(--cc98-color-primary);
  background: var(--cc98-color-surface);
  scroll-margin-top: 4rem;
}

.topic-post--hot {
  border-color: #ff4040;
}

.topic-post__user {
  display: grid;
  min-height: 100%;
  grid-template-columns: 8.3rem 7.2rem;
  padding: 1rem 0 1.25rem;
  background: var(--cc98-color-primary);
  color: #fff;
  font-size: 0.75rem;
}

.topic-post--hot .topic-post__user {
  background: #ff4040;
}

.topic-post__user-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1.4rem 0 0 1.5rem;
}

.topic-post__username,
.topic-post__username:visited {
  display: block;
  max-width: 6.5rem;
  margin-bottom: 0.75rem;
  overflow: hidden;
  color: #fff;
  font-size: 1rem;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.topic-post__hot-label {
  margin: -0.4rem 0 0.5rem;
  font-weight: 700;
}

.topic-post__anonymous {
  width: 6rem;
  margin-top: 0.5rem;
  border: 1px solid #fff;
  border-radius: 999px;
  line-height: 1.5rem;
  text-align: center;
}

.topic-post__portrait {
  position: relative;
  display: flex;
  min-width: 0;
  align-items: center;
  flex-direction: column;
  padding-top: 0.5rem;
}

.topic-post__gender {
  width: 90%;
  margin-bottom: 0.25rem;
  font-size: 1rem;
  text-align: right;
}

.topic-post__user-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

.topic-post__user-actions a,
.topic-post__user-actions a:visited {
  display: grid;
  width: 2.6rem;
  height: 1.4rem;
  border: 1px solid #fff;
  border-radius: 999px;
  color: #fff;
  font-size: 0.65rem;
  place-items: center;
}

.topic-post__main {
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: space-between;
  background: var(--cc98-color-surface);
}

.topic-post__content {
  min-height: 10rem;
  padding: 2rem 1.5rem 1rem;
  overflow-wrap: anywhere;
}

.topic-post__content h2 {
  margin: 0 0 1rem;
  font-size: 1rem;
}

.topic-post__content :deep(.rich-content) {
  max-width: 100%;
  color: var(--cc98-color-text);
}

.topic-post__content :deep(.rich-content > :first-child) {
  margin-top: 0;
}

.topic-post__content :deep(.rich-content figure) {
  max-width: 100%;
  margin: 0 0 1rem;
}

.topic-post__content :deep(.rich-content figure img) {
  max-width: 100%;
  max-height: none;
  border: 0;
  border-radius: 0;
}

.topic-post__content :deep(.rich-content--markdown p),
.topic-post__content :deep(.rich-content--markdown blockquote),
.topic-post__content :deep(.rich-content--markdown ul),
.topic-post__content :deep(.rich-content--markdown ol),
.topic-post__content :deep(.rich-content--markdown dl),
.topic-post__content :deep(.rich-content--markdown pre) {
  margin-top: 0;
  margin-bottom: 1rem;
}

.topic-post__content :deep(.rich-content-table-wrap) {
  margin: 0 0 1rem;
}

.topic-post__content :deep(.rich-content--markdown h1),
.topic-post__content :deep(.rich-content--markdown h2),
.topic-post__content :deep(.rich-content--markdown h3) {
  margin-top: 1.5rem;
  margin-bottom: 1rem;
  padding-bottom: 0.3em;
  border-bottom: 1px solid var(--cc98-color-border);
  font-weight: 600;
  line-height: 1.25;
}

.topic-post__content :deep(.rich-content--markdown h1) {
  font-size: 1.6em;
}

.topic-post__content :deep(.rich-content--markdown h2) {
  font-size: 1.4em;
}

.topic-post__content :deep(.rich-content--markdown h3) {
  font-size: 1.2em;
}

.topic-post__content :deep(.rich-content--markdown blockquote) {
  padding: 0 1em;
  border-left: 0.25em solid var(--cc98-color-border);
  background: transparent;
  color: var(--cc98-color-text-muted);
}

.topic-post__content :deep(.rich-content--ubb blockquote) {
  margin: 0;
  padding: 0 0 0 3em;
  border-left: 0.5em solid var(--cc98-color-border);
  background: transparent;
  color: var(--cc98-color-text-muted);
}

.topic-post__content :deep(.rich-content--markdown code:not(pre code)) {
  padding: 0.2em 0;
  border-radius: 3px;
  background: color-mix(in srgb, var(--cc98-color-text) 4%, transparent);
  font-size: 90%;
}

.topic-post__content :deep(.rich-content pre) {
  padding: 1rem;
  overflow: auto;
  border-radius: 3px;
  background: var(--cc98-color-surface-subtle);
  color: var(--cc98-color-text);
  font-size: 85%;
  line-height: 1.45;
}

.topic-post__content :deep(.rich-content pre code) {
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font-size: 100%;
  line-height: inherit;
  white-space: pre;
  word-break: normal;
}

.topic-post__content :deep(.rich-content table) {
  width: 100%;
  border-spacing: 0;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.topic-post__content :deep(.rich-content th) {
  font-weight: 700;
  white-space: nowrap;
}

.topic-post__content :deep(.rich-content th),
.topic-post__content :deep(.rich-content td) {
  padding: 0.375rem 0.8125rem;
  border: 1px solid var(--cc98-color-border);
}

.topic-post__deleted {
  color: var(--cc98-color-text-muted);
}

.topic-post__awards {
  margin: 0.5rem 1.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px dashed var(--cc98-color-accent);
  color: var(--cc98-color-accent);
  font-size: 0.75rem;
}

.topic-post__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0 1.25rem 0.3rem;
  color: var(--cc98-color-primary);
  font-size: 0.75rem;
}

.topic-post__footer > div:first-child {
  display: flex;
  min-width: 0;
  gap: 1rem;
  overflow: hidden;
  white-space: nowrap;
}

.topic-post__operations,
.topic-post__operations > div {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 0.5rem;
}

.topic-post__operations :deep(button),
.topic-post__operation-link,
.topic-post__operation-link:visited {
  display: inline-grid;
  width: auto;
  min-width: 2.25rem;
  height: 1.25rem;
  padding: 0 0.45rem;
  border: 1px solid var(--cc98-color-primary);
  border-radius: 999px;
  background: transparent;
  color: var(--cc98-color-primary);
  font: inherit;
  line-height: 1;
  place-items: center;
  white-space: nowrap;
}

.topic-post__operations :deep(button:hover),
.topic-post__operation-link:hover {
  background: var(--cc98-color-primary);
  color: #fff;
}

.topic-post__signature {
  max-height: 18.75rem;
  margin: 0.5rem 1.25rem 1.25rem;
  padding: 1rem 2rem 0;
  overflow: hidden;
  border-top: 1px solid var(--cc98-color-primary);
  color: var(--cc98-color-text-muted);
  overflow-wrap: anywhere;
}

.topic-post__signature img {
  max-width: 32.5rem;
  max-height: 12.5rem;
}

.topic-post__floor {
  position: absolute;
  top: 4.375rem;
  right: -0.8rem;
  display: grid;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: var(--cc98-color-primary);
  color: #fff;
  font-size: 1rem;
  place-items: center;
}

.topic-post__floor:visited,
.topic-post__floor:hover {
  color: #fff;
}

.topic-post__floor--hot {
  background: #ff4040;
}

.topic-post__floor--lz {
  top: 7.4rem;
  font-size: 0.8rem;
}

.topic-post__content > :deep(.cc98-card) {
  margin: -1rem 0 1.5rem;
  border-color: var(--cc98-color-primary);
  border-radius: 0;
  box-shadow: none;
}

@media (max-width: 1000px) {
  .topic-post {
    grid-template-columns: 13rem minmax(0, 1fr);
  }

  .topic-post__user {
    grid-template-columns: 7rem 6rem;
  }
}
</style>
