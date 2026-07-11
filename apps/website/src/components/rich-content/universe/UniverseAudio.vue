<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

const props = defineProps<{
  url: string;
  title?: string;
}>();

const container = ref<HTMLDivElement>();
let player: { destroy: () => void } | null = null;

onMounted(async () => {
  const APlayer = (await import("aplayer")).default;
  await import("aplayer/dist/APlayer.min.css");
  if (!container.value) return;
  player = new APlayer({
    container: container.value,
    autoplay: false,
    preload: "metadata",
    music: {
      url: encodeURI(props.url),
      title: props.title ?? props.url,
      author: "",
      pic: "",
    },
  });
});

onBeforeUnmount(() => {
  player?.destroy();
  player = null;
});
</script>

<template>
  <div ref="container" class="aplayer w-full max-w-[30rem]" />
</template>
