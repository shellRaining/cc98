<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

const props = defineProps<{
  url: string;
}>();

const container = ref<HTMLDivElement>();
let player: { destroy: () => void } | null = null;

onMounted(async () => {
  const DPlayer = (await import("dplayer")).default;
  const isHls = props.url.match(/\.m3u8$/);
  const Hls = isHls ? (await import("hls.js")).default : undefined;

  if (!container.value) return;
  player = new DPlayer({
    container: container.value,
    lang: "zh-cn",
    autoplay: false,
    preload: "metadata",
    video: {
      url: encodeURI(props.url),
      type: Hls ? "hls" : undefined,
      customType: Hls
        ? {
            hls: (video: HTMLVideoElement) => {
              if (!Hls.isSupported()) return;
              const hls = new Hls();
              hls.loadSource(video.src);
              hls.attachMedia(video);
            },
          }
        : undefined,
    },
  });
});

onBeforeUnmount(() => {
  player?.destroy();
  player = null;
});
</script>

<template>
  <div ref="container" class="dplayer w-full max-w-2xl" />
</template>
