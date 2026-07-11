<script setup lang="ts">
import { parseUbb } from "@cc98/ubb";
import { computed } from "vue";
import MarkdownRenderer from "./markdown/MarkdownRenderer.vue";
import { resolveRichContentOptions } from "./options";
import type { ContentRendererProps } from "./types";
import UbbRenderer from "./ubb/UbbRenderer.vue";

const props = defineProps<ContentRendererProps>();

const resolvedOptions = computed(() => resolveRichContentOptions(props.options));
const ubbNodes = computed(() => (props.type === "ubb" ? parseUbb(props.content) : []));
</script>

<template>
  <UbbRenderer v-if="type === 'ubb'" :key="content" :nodes="ubbNodes" :options="resolvedOptions" />
  <MarkdownRenderer v-else :content="content" :options="resolvedOptions" />
</template>
