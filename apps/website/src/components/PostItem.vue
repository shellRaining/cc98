<script setup lang="ts">
import { computed } from "vue";
import { POST_CONTENT_TYPE, type Post, type PostContentType, type User } from "@cc98/api";
import dayjs from "dayjs";
import PostActions from "./PostActions.vue";
import UiButton from "./ui/Button.vue";
import ContentRenderer from "./rich-content/ContentRenderer.vue";
import type { RichContentType } from "./rich-content/types";
import { floorAnchorId } from "../lib/route-params";

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

function replaceBrokenAvatar(event: Event) {
  const image = event.currentTarget as HTMLImageElement;
  image.src = props.post.isAnonymous
    ? "/static/images/心灵头像.gif"
    : "/static/images/default_avatar_boy.png";
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
        <RouterLink v-if="authorLink" :to="authorLink">
          <img :src="avatar" :alt="`${author} 的头像`" @error="replaceBrokenAvatar" />
        </RouterLink>
        <img v-else :src="avatar" alt="匿名用户头像" @error="replaceBrokenAvatar" />
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
