<script setup lang="ts">
import { ref } from "vue";

const props = withDefaults(
  defineProps<{
    src: string;
    alt?: string;
    title?: string;
    defaultVisible?: boolean;
    allowToolbox?: boolean;
    showCaption?: boolean;
  }>(),
  {
    alt: "",
    title: undefined,
    defaultVisible: true,
    allowToolbox: false,
    showCaption: false,
  },
);

const visible = ref(props.defaultVisible);
const failed = ref(false);
const rotation = ref(0);
</script>

<template>
  <figure class="my-3 max-w-full">
    <button
      v-if="!visible && !failed"
      type="button"
      class="rounded border border-cc98-primary px-3 py-1.5 text-cc98-primary"
      @click="visible = true"
    >
      点击查看图片
    </button>
    <p v-else-if="failed" class="text-sm text-cc98-text-muted">图片加载失败：{{ alt || src }}</p>
    <div v-else class="group relative inline-block max-w-full">
      <img
        :src="src"
        :alt="alt"
        :title="title"
        loading="lazy"
        class="max-h-[80vh] max-w-full rounded border border-cc98-border object-contain"
        :style="{ transform: `rotate(${rotation}deg)` }"
        @error="failed = true"
      />
      <div
        v-if="allowToolbox"
        class="absolute right-2 top-2 hidden gap-1 rounded bg-black/65 p-1 text-xs text-white group-hover:flex"
      >
        <button type="button" class="px-2 py-1" @click="rotation += 90">右旋</button>
        <button type="button" class="px-2 py-1" @click="rotation -= 90">左旋</button>
        <a :href="src" target="_blank" rel="noopener noreferrer" class="px-2 py-1 text-white">
          原图
        </a>
        <button type="button" class="px-2 py-1" @click="visible = false">收起</button>
      </div>
    </div>
    <figcaption v-if="showCaption && title" class="mt-1 text-sm text-cc98-text-muted">
      {{ title }}
    </figcaption>
  </figure>
</template>
