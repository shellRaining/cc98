<script setup lang="ts">
import { computed, type CSSProperties } from "vue";
import { getAvatarFrame, type AvatarFrameVariant } from "./avatar-frame";
import { DEFAULT_AVATAR_URL, resolveAvatarUrl } from "./avatar";

const props = withDefaults(
  defineProps<{
    src: string;
    alt: string;
    displayTitleId?: number | null;
    to?: string | null;
    variant?: AvatarFrameVariant;
    fallback?: string;
  }>(),
  {
    displayTitleId: null,
    to: null,
    variant: "post",
    fallback: DEFAULT_AVATAR_URL,
  },
);

const frame = computed(() => getAvatarFrame(props.displayTitleId));
const avatarUrl = computed(() => resolveAvatarUrl(props.src, props.fallback));
const fallbackUrl = computed(() => resolveAvatarUrl(props.fallback));
const frameStyle = computed<CSSProperties | undefined>(() => {
  const definition = frame.value;
  if (!definition) return undefined;
  const style = definition[props.variant];
  return {
    width: style.width,
    top: style.top,
    ...(style.left ? { left: style.left } : {}),
  };
});

function replaceBrokenAvatar(event: Event) {
  const image = event.currentTarget as HTMLImageElement;
  if (image.src.endsWith(fallbackUrl.value)) return;
  image.src = fallbackUrl.value;
}
</script>

<template>
  <div
    class="framed-avatar"
    :class="[
      `framed-avatar--${variant}`,
      {
        'framed-avatar--has-frame': frame,
        'framed-avatar--flat': frame && !frame.keepPostShadow,
      },
    ]"
  >
    <RouterLink v-if="to" :to="to" class="framed-avatar__link">
      <img
        class="framed-avatar__portrait"
        :src="avatarUrl"
        :alt="alt"
        @error="replaceBrokenAvatar"
      />
    </RouterLink>
    <span v-else class="framed-avatar__link">
      <img
        class="framed-avatar__portrait"
        :src="avatarUrl"
        :alt="alt"
        @error="replaceBrokenAvatar"
      />
    </span>
    <span v-if="frame" class="framed-avatar__frame" aria-hidden="true">
      <img :src="frame.imageUrl" alt="" :style="frameStyle" />
    </span>
  </div>
</template>

<style scoped>
.framed-avatar {
  position: relative;
}

.framed-avatar__link {
  position: relative;
  z-index: 100;
  display: block;
}

.framed-avatar__portrait {
  display: block;
  border-radius: 50%;
  object-fit: cover;
}

.framed-avatar__frame {
  position: absolute;
  z-index: 150;
  pointer-events: none;
}

.framed-avatar__frame img {
  position: absolute;
  display: block;
  max-width: none;
}

.framed-avatar--post {
  display: flex;
  width: 100%;
  height: 5rem;
  justify-content: center;
}

.framed-avatar--post .framed-avatar__link {
  max-height: 5rem;
}

.framed-avatar--post .framed-avatar__portrait {
  display: block;
  width: 5rem;
  height: 5rem;
  box-shadow: 0 0 5px rgb(0 0 0 / 0.45);
}

.framed-avatar--post.framed-avatar--flat .framed-avatar__portrait {
  box-shadow: none;
}

.framed-avatar--post .framed-avatar__frame {
  top: 50%;
  left: 50%;
}

.framed-avatar--profile {
  width: 10rem;
  height: 10rem;
}

.framed-avatar--profile .framed-avatar__portrait {
  width: 10rem;
  height: 10rem;
}

.framed-avatar--profile .framed-avatar__frame {
  inset: 0;
}

.framed-avatar--profile .framed-avatar__frame img:not([style*="left"]),
.framed-avatar--profile .framed-avatar__frame img[style*="left: auto"] {
  left: 50%;
  transform: translateX(-50%);
}
</style>
