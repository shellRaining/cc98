<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

const props = defineProps<{
  url: string;
  hls?: boolean;
}>();

const container = ref<HTMLDivElement>();
let player: any = null;

onMounted(async () => {
  const DPlayer = (await import("dplayer")).default;
  await import("dplayer/dist/DPlayer.min.css");

  let Hls: typeof import("hls.js").default | undefined;
  if (props.hls || props.url.match(/\.m3u8$/)) {
    Hls = (await import("hls.js")).default;
  }

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
              if (Hls!.isSupported()) {
                const hls = new Hls!();
                hls.loadSource(video.src);
                hls.attachMedia(video);
              }
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
  <div ref="container" class="dplayer" style="width: 100%; max-width: 40rem" />
</template>
