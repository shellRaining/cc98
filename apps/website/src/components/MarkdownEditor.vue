<script setup lang="ts">
import { computed, ref } from "vue";
import { MdEditor } from "md-editor-v3";
import "md-editor-v3/lib/style.css";
import { normalizeApiError } from "../lib/api-error";
import { appendMarkdownBlock, createAttachmentMarkdown } from "../lib/interactions";
import { useThemeStore } from "../stores/theme";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    disabled?: boolean;
    maxLength?: number;
    placeholder?: string;
    uploadImages?: (files: File[]) => Promise<string[]>;
    uploadAttachments?: (files: File[]) => Promise<string[]>;
  }>(),
  {
    disabled: false,
    maxLength: 20_000,
    placeholder: "使用 Markdown 编写内容",
    uploadImages: undefined,
    uploadAttachments: undefined,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const theme = useThemeStore();
const uploadError = ref("");
const attachmentInput = ref<HTMLInputElement | null>(null);
const attachmentUploading = ref(false);
const value = computed({
  get: () => props.modelValue,
  set: (next: string) => emit("update:modelValue", next),
});
const overLimit = computed(() => value.value.length > props.maxLength);

async function handleUpload(files: File[], callback: (urls: string[]) => void) {
  uploadError.value = "";
  if (!props.uploadImages) {
    uploadError.value = "当前页面不支持图片上传";
    return;
  }
  try {
    callback(await props.uploadImages(files));
  } catch (error) {
    uploadError.value = normalizeApiError(error).message;
  }
}

async function handleAttachmentChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = [...(input.files ?? [])];
  input.value = "";
  if (files.length === 0) return;

  uploadError.value = "";
  if (!props.uploadAttachments) {
    uploadError.value = "当前页面不支持附件上传";
    return;
  }

  attachmentUploading.value = true;
  try {
    const urls = await props.uploadAttachments(files);
    const block = createAttachmentMarkdown(
      files.map((file) => file.name),
      urls,
    );
    value.value = appendMarkdownBlock(value.value, block);
  } catch (error) {
    uploadError.value = normalizeApiError(error).message;
  } finally {
    attachmentUploading.value = false;
  }
}
</script>

<template>
  <div class="space-y-2">
    <MdEditor
      v-model="value"
      :disabled="disabled"
      :theme="theme.mode"
      :placeholder="placeholder"
      :on-upload-img="handleUpload"
      language="zh-CN"
    />
    <div class="flex flex-wrap items-center gap-3 text-sm">
      <button
        type="button"
        class="cc98-link disabled:opacity-50"
        :disabled="disabled || attachmentUploading"
        @click="attachmentInput?.click()"
      >
        {{ attachmentUploading ? "附件上传中…" : "上传附件" }}
      </button>
      <span class="text-cc98-text-muted">可一次选择多个文件，上传后插入 Markdown 链接。</span>
      <input
        ref="attachmentInput"
        type="file"
        multiple
        class="hidden"
        :disabled="disabled || attachmentUploading"
        @change="handleAttachmentChange"
      />
    </div>
    <div class="flex flex-wrap justify-between gap-2 text-xs">
      <p v-if="uploadError" class="text-cc98-accent">{{ uploadError }}</p>
      <span v-else />
      <p :class="overLimit ? 'text-cc98-accent' : 'text-cc98-text-muted'">
        {{ value.length }} / {{ maxLength }} 字
      </p>
    </div>
  </div>
</template>
