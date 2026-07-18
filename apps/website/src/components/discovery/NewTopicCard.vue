<script setup lang="ts">
import type { BasicUser, Board, Topic } from "@cc98/api";
import { computed, ref } from "vue";
import { defaultRichContentOptions } from "../rich-content/options";
import { sanitizeImageUrl, sanitizeMediaUrl } from "../rich-content/security";
import { formatDiscoveryTime } from "../../lib/discovery";

const props = defineProps<{
  topic: Topic;
  board?: Board;
  author?: BasicUser;
  tagNames?: string[];
}>();

const selectedImage = ref<string | null>(null);
const anonymous = computed(() => props.topic.isAnonymous || props.topic.userId == null);
const authorName = computed(() =>
  anonymous.value ? "匿名用户" : props.topic.userName || "已注销用户",
);
const authorUrl = computed(() =>
  anonymous.value || props.topic.userId == null ? null : `/user/id/${props.topic.userId}`,
);
const avatar = computed(() =>
  anonymous.value
    ? "/static/images/_心灵之约.png"
    : props.author?.portraitUrl || "/static/images/default_avatar_boy.png",
);
const thumbnails = computed(() =>
  (props.topic.mediaContent?.thumbnail ?? [])
    .map((url) => sanitizeImageUrl(url, defaultRichContentOptions))
    .filter((url): url is string => url != null)
    .slice(0, 6),
);
const videoUrl = computed(() =>
  props.topic.mediaContent?.video
    ? sanitizeMediaUrl(props.topic.mediaContent.video, defaultRichContentOptions)
    : null,
);
const audioUrl = computed(() =>
  props.topic.mediaContent?.audio
    ? sanitizeMediaUrl(props.topic.mediaContent.audio, defaultRichContentOptions)
    : null,
);

function toggleImage(url: string) {
  selectedImage.value = selectedImage.value === url ? null : url;
}

function replaceBrokenAvatar(event: Event) {
  const image = event.currentTarget as HTMLImageElement;
  image.src = anonymous.value
    ? "/static/images/_心灵之约.png"
    : "/static/images/default_avatar_boy.png";
}
</script>

<template>
  <article class="new-topic-card">
    <component
      :is="authorUrl ? 'RouterLink' : 'div'"
      :to="authorUrl || undefined"
      class="new-topic-card__avatar"
    >
      <img
        :src="avatar"
        :alt="anonymous ? '匿名用户头像' : `${authorName} 的头像`"
        @error="replaceBrokenAvatar"
      />
    </component>

    <div class="new-topic-card__body">
      <div class="new-topic-card__author-line">
        <component :is="authorUrl ? 'RouterLink' : 'span'" :to="authorUrl || undefined">
          {{ authorName }}
        </component>
        <RouterLink :to="`/topic/${topic.id}`">{{ formatDiscoveryTime(topic.time) }}</RouterLink>
      </div>
      <RouterLink :to="`/topic/${topic.id}`" class="new-topic-card__title">
        {{ topic.title?.trim() || "（无标题）" }}
      </RouterLink>

      <button
        v-if="selectedImage"
        type="button"
        class="new-topic-card__selected-image"
        aria-label="收起原图"
        @click="selectedImage = null"
      >
        <img :src="selectedImage" alt="帖子图片预览" />
      </button>
      <div
        v-else-if="topic.contentType === 4 && thumbnails.length"
        class="new-topic-card__images"
        :data-count="Math.min(thumbnails.length, 3)"
      >
        <button v-for="image in thumbnails" :key="image" type="button" @click="toggleImage(image)">
          <img :src="image" alt="帖子图片缩略图" />
        </button>
      </div>
      <video
        v-else-if="topic.contentType === 2 && videoUrl"
        controls
        preload="metadata"
        :poster="thumbnails[0]"
        class="new-topic-card__video"
      >
        <source :src="videoUrl" />
      </video>
      <audio
        v-else-if="topic.contentType === 3 && audioUrl"
        controls
        preload="metadata"
        class="new-topic-card__audio"
        :src="audioUrl"
      />

      <div class="new-topic-card__board-line">
        <RouterLink :to="`/list/${topic.boardId}`">{{
          board?.name || topic.boardName || `版面 ${topic.boardId}`
        }}</RouterLink>
        <span v-for="tag in tagNames" :key="tag">{{ tag }}</span>
      </div>
      <div class="new-topic-card__meta">
        <span>◉ {{ topic.hitCount ?? 0 }}</span>
        <span>回 {{ topic.replyCount ?? 0 }}</span>
        <span>最后回复：{{ topic.lastPostUser || "暂无" }}</span>
        <span>{{ formatDiscoveryTime(topic.lastPostTime) }}</span>
      </div>
    </div>
  </article>
</template>

<style scoped>
.new-topic-card {
  overflow: hidden;
  border: 1.5px solid var(--cc98-color-primary);
  border-radius: 0.25rem;
  background: var(--cc98-color-surface);
}

.new-topic-card {
  display: grid;
  grid-template-columns: 5.625rem minmax(0, 1fr);
  margin-bottom: 0.375rem;
}

.new-topic-card__avatar {
  padding-top: 0.75rem;
  text-align: center;
}

.new-topic-card__avatar img {
  width: 3.75rem;
  height: 3.75rem;
  border-radius: 50%;
  object-fit: cover;
}

.new-topic-card__body {
  min-width: 0;
  padding: 0.65rem 0.85rem 0.75rem 0;
}

.new-topic-card__author-line,
.new-topic-card__board-line,
.new-topic-card__meta {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.75rem;
}

.new-topic-card__author-line {
  justify-content: space-between;
}

.new-topic-card__author-line a,
.new-topic-card__author-line span {
  color: var(--cc98-color-text-muted);
}

.new-topic-card__title,
.new-topic-card__title:visited {
  display: block;
  margin: 0.4rem 0 0.65rem;
  overflow: hidden;
  color: var(--cc98-color-text);
  font-size: 1rem;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.new-topic-card__images {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.25rem;
  margin-bottom: 0.65rem;
}

.new-topic-card__images button,
.new-topic-card__selected-image {
  padding: 0;
  overflow: hidden;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.new-topic-card__images img {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
}

.new-topic-card__selected-image {
  display: block;
  width: 100%;
  margin-bottom: 0.65rem;
}

.new-topic-card__selected-image img,
.new-topic-card__video {
  display: block;
  width: 100%;
  max-height: 28rem;
  object-fit: contain;
}

.new-topic-card__audio {
  width: 100%;
  margin-bottom: 0.65rem;
}

.new-topic-card__board-line {
  flex-wrap: wrap;
  margin-top: 0.35rem;
}

.new-topic-card__board-line span {
  padding: 0 0.45rem;
  border: 1px solid var(--cc98-color-primary);
  border-radius: 999px;
  color: var(--cc98-color-primary);
}

.new-topic-card__meta {
  gap: 0.85rem;
  margin-top: 0.55rem;
  color: var(--cc98-color-text-muted);
  white-space: nowrap;
}
</style>
