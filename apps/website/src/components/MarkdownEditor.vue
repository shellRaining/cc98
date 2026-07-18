<script setup lang="ts">
import {
  defaultValueCtx,
  Editor,
  editorViewCtx,
  editorViewOptionsCtx,
  rootCtx,
  type CmdKey,
} from "@milkdown/kit/core";
import { history, redoCommand, undoCommand } from "@milkdown/kit/plugin/history";
import { listener, listenerCtx } from "@milkdown/kit/plugin/listener";
import { upload, uploadConfig } from "@milkdown/kit/plugin/upload";
import {
  commonmark,
  createCodeBlockCommand,
  insertImageCommand,
  toggleEmphasisCommand,
  toggleLinkCommand,
  toggleStrongCommand,
  wrapInBlockquoteCommand,
  wrapInBulletListCommand,
  wrapInHeadingCommand,
  wrapInOrderedListCommand,
} from "@milkdown/kit/preset/commonmark";
import { gfm, insertTableCommand, toggleStrikethroughCommand } from "@milkdown/kit/preset/gfm";
import { callCommand, replaceAll } from "@milkdown/kit/utils";
import "@milkdown/kit/prose/gapcursor/style/gapcursor.css";
import "@milkdown/kit/prose/tables/style/tables.css";
import "@milkdown/kit/prose/view/style/prosemirror.css";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { normalizeApiError } from "../lib/api-error";
import { createLogger } from "../lib/logger";
import { appendMarkdownBlock, createAttachmentMarkdown } from "./markdown-editor";
import UiButton from "./ui/Button.vue";

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

const logger = createLogger("markdown-editor");
const editorRoot = ref<HTMLDivElement | null>(null);
const imageInput = ref<HTMLInputElement | null>(null);
const attachmentInput = ref<HTMLInputElement | null>(null);
const linkInput = ref<HTMLInputElement | null>(null);
const editor = ref<Editor | null>(null);
const editorReady = ref(false);
const editorFocused = ref(false);
const imageUploading = ref(false);
const attachmentUploading = ref(false);
const uploadError = ref("");
const linkFormOpen = ref(false);
const linkHref = ref("https://");
const currentMarkdown = ref(props.modelValue);
const overLimit = computed(() => currentMarkdown.value.length > props.maxLength);
const showPlaceholder = computed(
  () => editorReady.value && !editorFocused.value && currentMarkdown.value.length === 0,
);

function runCommand<T>(key: CmdKey<T>, payload?: T) {
  if (props.disabled || !editor.value) return false;
  const handled = editor.value.action(callCommand(key, payload));
  editor.value.action((ctx) => ctx.get(editorViewCtx).focus());
  return handled;
}

function replaceEditorMarkdown(markdown: string) {
  currentMarkdown.value = markdown;
  editor.value?.action(replaceAll(markdown));
}

async function uploadImageFiles(files: File[]): Promise<string[]> {
  uploadError.value = "";
  if (props.disabled) return [];
  if (!props.uploadImages) {
    uploadError.value = "当前页面不支持图片上传";
    return [];
  }
  try {
    return await props.uploadImages(files);
  } catch (error) {
    uploadError.value = normalizeApiError(error).message;
    return [];
  }
}

async function handleImageChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = [...(input.files ?? [])];
  input.value = "";
  if (files.length === 0) return;

  imageUploading.value = true;
  try {
    const urls = await uploadImageFiles(files);
    for (const [index, url] of urls.entries()) {
      runCommand(insertImageCommand.key, { src: url, alt: files[index]?.name ?? "" });
    }
  } finally {
    imageUploading.value = false;
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
    const next = appendMarkdownBlock(currentMarkdown.value, block);
    replaceEditorMarkdown(next);
    emit("update:modelValue", next);
  } catch (error) {
    uploadError.value = normalizeApiError(error).message;
  } finally {
    attachmentUploading.value = false;
  }
}

async function openLinkForm() {
  if (props.disabled) return;
  linkHref.value = "https://";
  linkFormOpen.value = true;
  await nextTick();
  linkInput.value?.focus();
  linkInput.value?.select();
}

function closeLinkForm() {
  linkFormOpen.value = false;
}

function addLink() {
  const href = linkHref.value.trim();
  if (!href) return;
  runCommand(toggleLinkCommand.key, { href });
  closeLinkForm();
}

onMounted(async () => {
  if (!editorRoot.value) return;

  const instance = Editor.make()
    .config((ctx) => {
      ctx.set(rootCtx, editorRoot.value);
      ctx.set(defaultValueCtx, props.modelValue);
      ctx.update(editorViewOptionsCtx, (previous) => ({
        ...previous,
        attributes: {
          ...previous.attributes,
          "aria-label": props.placeholder,
          class: "cc98-milkdown-editor",
        },
        editable: () => !props.disabled,
      }));

      const listeners = ctx.get(listenerCtx);
      listeners.markdownUpdated((_ctx, markdown, previous) => {
        if (markdown === previous) return;
        currentMarkdown.value = markdown;
        if (markdown !== props.modelValue) emit("update:modelValue", markdown);
      });
      listeners.focus(() => {
        editorFocused.value = true;
      });
      listeners.blur(() => {
        editorFocused.value = false;
      });

      ctx.update(uploadConfig.key, (previous) => ({
        ...previous,
        uploader: async (files, schema) => {
          if (props.disabled) return [];
          const images = [...files].filter((file) => file.type.startsWith("image/"));
          if (images.length === 0) return [];
          imageUploading.value = true;
          try {
            const urls = await uploadImageFiles(images);
            return urls.flatMap((url, index) => {
              const node = schema.nodes.image?.createAndFill({
                src: url,
                alt: images[index]?.name ?? "",
              });
              return node ? [node] : [];
            });
          } finally {
            imageUploading.value = false;
          }
        },
      }));
    })
    .use(commonmark)
    .use(gfm)
    .use(history)
    .use(listener)
    .use(upload);

  try {
    editor.value = await instance.create();
    editorReady.value = true;
  } catch (error) {
    logger.error({ err: error }, "Milkdown 编辑器初始化失败");
    uploadError.value = "编辑器加载失败，请刷新页面重试";
  }
});

watch(
  () => props.modelValue,
  (markdown) => {
    if (markdown === currentMarkdown.value) return;
    replaceEditorMarkdown(markdown);
  },
);

watch(
  () => props.disabled,
  (disabled) => {
    if (disabled) closeLinkForm();
    editor.value?.action((ctx) => {
      ctx.get(editorViewCtx).setProps({ editable: () => !disabled });
    });
  },
);

onBeforeUnmount(() => {
  editorReady.value = false;
  void editor.value?.destroy();
  editor.value = null;
});
</script>

<template>
  <div class="markdown-editor space-y-2" :class="{ 'markdown-editor--disabled': disabled }">
    <div class="markdown-editor__shell">
      <div class="markdown-editor__toolbar" role="toolbar" aria-label="Markdown 编辑工具栏">
        <UiButton
          variant="text"
          size="sm"
          :disabled="disabled"
          @click="runCommand(undoCommand.key)"
        >
          撤销
        </UiButton>
        <UiButton
          variant="text"
          size="sm"
          :disabled="disabled"
          @click="runCommand(redoCommand.key)"
        >
          重做
        </UiButton>
        <UiButton
          variant="text"
          size="sm"
          :disabled="disabled"
          @click="runCommand(wrapInHeadingCommand.key, 2)"
        >
          标题
        </UiButton>
        <UiButton
          variant="text"
          size="sm"
          :disabled="disabled"
          @click="runCommand(toggleStrongCommand.key)"
        >
          加粗
        </UiButton>
        <UiButton
          variant="text"
          size="sm"
          :disabled="disabled"
          @click="runCommand(toggleEmphasisCommand.key)"
        >
          斜体
        </UiButton>
        <UiButton
          variant="text"
          size="sm"
          :disabled="disabled"
          @click="runCommand(toggleStrikethroughCommand.key)"
        >
          删除线
        </UiButton>
        <UiButton
          variant="text"
          size="sm"
          :disabled="disabled"
          @click="runCommand(wrapInBlockquoteCommand.key)"
        >
          引用
        </UiButton>
        <UiButton
          variant="text"
          size="sm"
          :disabled="disabled"
          @click="runCommand(wrapInBulletListCommand.key)"
        >
          列表
        </UiButton>
        <UiButton
          variant="text"
          size="sm"
          :disabled="disabled"
          @click="runCommand(wrapInOrderedListCommand.key)"
        >
          编号
        </UiButton>
        <UiButton
          variant="text"
          size="sm"
          :disabled="disabled"
          @click="runCommand(createCodeBlockCommand.key)"
        >
          代码块
        </UiButton>
        <UiButton
          variant="text"
          size="sm"
          :disabled="disabled"
          @click="runCommand(insertTableCommand.key, { row: 3, col: 3 })"
        >
          表格
        </UiButton>
        <UiButton variant="text" size="sm" :disabled="disabled" @click="openLinkForm">
          链接
        </UiButton>
        <UiButton
          variant="text"
          size="sm"
          :disabled="disabled || imageUploading"
          @click="imageInput?.click()"
        >
          {{ imageUploading ? "图片上传中…" : "图片" }}
        </UiButton>
      </div>
      <form
        v-if="linkFormOpen"
        class="markdown-editor__link-form"
        aria-label="插入链接"
        @submit.prevent="addLink"
        @keydown.esc.prevent="closeLinkForm"
      >
        <label for="markdown-editor-link">链接地址</label>
        <input
          id="markdown-editor-link"
          ref="linkInput"
          v-model="linkHref"
          type="url"
          required
          autocomplete="url"
          placeholder="https://example.com"
        />
        <UiButton type="submit" size="sm">插入</UiButton>
        <UiButton type="button" variant="text" size="sm" @click="closeLinkForm">取消</UiButton>
      </form>
      <div class="markdown-editor__surface">
        <span v-if="showPlaceholder" class="markdown-editor__placeholder">{{ placeholder }}</span>
        <div ref="editorRoot" />
        <p v-if="!editorReady && !uploadError" class="markdown-editor__loading">编辑器加载中…</p>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-3 text-sm">
      <UiButton
        variant="text"
        size="sm"
        :disabled="disabled || attachmentUploading"
        @click="attachmentInput?.click()"
      >
        {{ attachmentUploading ? "附件上传中…" : "上传附件" }}
      </UiButton>
      <span class="text-cc98-text-muted">可一次选择多个文件，上传后插入 Markdown 链接。</span>
      <input
        ref="imageInput"
        type="file"
        accept="image/*"
        multiple
        class="hidden"
        :disabled="disabled || imageUploading"
        @change="handleImageChange"
      />
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
        {{ currentMarkdown.length }} / {{ maxLength }} 字
      </p>
    </div>
  </div>
</template>

<style scoped>
.markdown-editor__shell {
  overflow: hidden;
  border: 1px solid var(--cc98-color-border);
  border-radius: var(--cc98-radius-sm);
  background: var(--cc98-color-surface);
}

.markdown-editor__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.125rem;
  border-bottom: 1px solid var(--cc98-color-border);
  padding: 0.25rem 0.5rem;
  background: var(--cc98-color-surface-subtle);
}

.markdown-editor__link-form {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-bottom: 1px solid var(--cc98-color-border);
  padding: 0.5rem;
  background: var(--cc98-color-surface-subtle);
  font-size: 0.875rem;
}

.markdown-editor__link-form input {
  min-width: 0;
  flex: 1;
  border: 1px solid var(--cc98-color-border);
  border-radius: var(--cc98-radius-sm);
  padding: 0.375rem 0.5rem;
  background: var(--cc98-color-surface);
  color: var(--cc98-color-text);
}

.markdown-editor__surface {
  position: relative;
  min-height: 20rem;
}

.markdown-editor__placeholder,
.markdown-editor__loading {
  position: absolute;
  z-index: 1;
  top: 1rem;
  left: 1rem;
  margin: 0;
  color: var(--cc98-color-text-caption);
  pointer-events: none;
}

.markdown-editor--disabled .markdown-editor__surface {
  background: var(--cc98-color-surface-subtle);
}

.markdown-editor :deep(.milkdown),
.markdown-editor :deep(.cc98-milkdown-editor) {
  min-height: 20rem;
}

.markdown-editor :deep(.cc98-milkdown-editor) {
  box-sizing: border-box;
  padding: 1rem;
  color: var(--cc98-color-text);
  font-family: system-ui, "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 0.875rem;
  line-height: 1.7;
  outline: none;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.markdown-editor :deep(.cc98-milkdown-editor > :first-child) {
  margin-top: 0;
}

.markdown-editor :deep(.cc98-milkdown-editor > :last-child) {
  margin-bottom: 0;
}

.markdown-editor :deep(.cc98-milkdown-editor h1),
.markdown-editor :deep(.cc98-milkdown-editor h2),
.markdown-editor :deep(.cc98-milkdown-editor h3),
.markdown-editor :deep(.cc98-milkdown-editor h4),
.markdown-editor :deep(.cc98-milkdown-editor h5),
.markdown-editor :deep(.cc98-milkdown-editor h6) {
  margin-block: 1.25rem 0.5rem;
  font-weight: 700;
  line-height: 1.35;
}

.markdown-editor :deep(.cc98-milkdown-editor h1) {
  font-size: 1.5rem;
}

.markdown-editor :deep(.cc98-milkdown-editor h2) {
  font-size: 1.25rem;
}

.markdown-editor :deep(.cc98-milkdown-editor h3) {
  font-size: 1.125rem;
}

.markdown-editor :deep(.cc98-milkdown-editor p) {
  margin-block: 0.5rem;
}

.markdown-editor :deep(.cc98-milkdown-editor ul),
.markdown-editor :deep(.cc98-milkdown-editor ol) {
  margin-block: 0.5rem;
  padding-left: 1.5rem;
}

.markdown-editor :deep(.cc98-milkdown-editor ul) {
  list-style: disc;
}

.markdown-editor :deep(.cc98-milkdown-editor ol) {
  list-style: decimal;
}

.markdown-editor :deep(.cc98-milkdown-editor blockquote) {
  margin-block: 0.75rem;
  border-left: 3px solid var(--cc98-color-primary);
  padding-left: 0.75rem;
  color: var(--cc98-color-text-muted);
}

.markdown-editor :deep(.cc98-milkdown-editor pre) {
  overflow-x: auto;
  margin-block: 0.75rem;
  padding: 0.75rem;
  background: var(--cc98-color-surface-subtle);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  white-space: pre;
}

.markdown-editor :deep(.cc98-milkdown-editor code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.markdown-editor :deep(.cc98-milkdown-editor table) {
  width: 100%;
  margin-block: 0.75rem;
  border-collapse: collapse;
}

.markdown-editor :deep(.cc98-milkdown-editor th),
.markdown-editor :deep(.cc98-milkdown-editor td) {
  border: 1px solid var(--cc98-color-border);
  padding: 0.5rem 0.75rem;
}

.markdown-editor :deep(.cc98-milkdown-editor img) {
  max-width: 100%;
}

.markdown-editor :deep(.cc98-milkdown-editor.ProseMirror-focused) {
  box-shadow: inset 0 0 0 1px var(--cc98-color-primary);
}
</style>
