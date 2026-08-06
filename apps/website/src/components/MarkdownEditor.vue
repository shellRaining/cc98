<script setup lang="ts">
import { ubbEmotionDisplayName, type UbbEmotionDescriptor } from "@cc98/ubb";
import { CrepeBuilder } from "@milkdown/crepe/builder";
import { blockEdit } from "@milkdown/crepe/feature/block-edit";
import { codeMirror } from "@milkdown/crepe/feature/code-mirror";
import { cursor } from "@milkdown/crepe/feature/cursor";
import { latex } from "@milkdown/crepe/feature/latex";
import { linkTooltip } from "@milkdown/crepe/feature/link-tooltip";
import { listItem } from "@milkdown/crepe/feature/list-item";
import { placeholder } from "@milkdown/crepe/feature/placeholder";
import { table } from "@milkdown/crepe/feature/table";
import { toolbar } from "@milkdown/crepe/feature/toolbar";
import { topBar } from "@milkdown/crepe/feature/top-bar";
import "@milkdown/crepe/theme/classic.css";
import "@milkdown/crepe/theme/common/style.css";
import { type Editor, editorViewCtx, editorViewOptionsCtx, type CmdKey } from "@milkdown/kit/core";
import { clipboard } from "@milkdown/kit/plugin/clipboard";
import { uploadConfig } from "@milkdown/kit/plugin/upload";
import { insertImageCommand, insertImageInputRule } from "@milkdown/kit/preset/commonmark";
import { callCommand, replaceAll } from "@milkdown/kit/utils";
import { onClickOutside } from "@vueuse/core";
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type ComponentPublicInstance,
} from "vue";
import { normalizeApiError } from "../lib/api-error";
import { createLogger } from "../lib/logger";
import { useThemeStore } from "../stores/theme";
import { appendMarkdownBlock, createAttachmentMarkdown } from "./markdown-editor";
import EmojiPanel from "./markdown-editor/EmojiPanel.vue";
import { emojiButtonIcon, resolveEmotionDisplaySrc } from "./markdown-editor/emoji-data";
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
const theme = useThemeStore();
const editorRoot = ref<HTMLDivElement | null>(null);
const imageInput = ref<HTMLInputElement | null>(null);
const attachmentInput = ref<HTMLInputElement | null>(null);
const crepe = ref<CrepeBuilder | null>(null);
const editor = ref<Editor | null>(null);
const editorReady = ref(false);
const imageUploading = ref(false);
const attachmentUploading = ref(false);
const uploadError = ref("");
const currentMarkdown = ref(props.modelValue);
const emojiPanelOpen = ref(false);
const emojiPanel = ref<ComponentPublicInstance | null>(null);
const overLimit = computed(() => currentMarkdown.value.length > props.maxLength);
const topBarLabels = [
  "加粗",
  "斜体",
  "删除线",
  "行内代码",
  "无序列表",
  "有序列表",
  "任务列表",
  "插入链接",
  "插入表格",
  "代码块",
  "公式",
  "引用",
  "分隔线",
  "表情",
] as const;
const selectionToolbarLabels = [
  "加粗",
  "斜体",
  "删除线",
  "行内代码",
  "行内公式",
  "插入链接",
] as const;

function labelIconButtons(selector: string, labels: readonly string[]) {
  editorRoot.value?.querySelectorAll<HTMLButtonElement>(selector).forEach((button, index) => {
    const label = labels[index];
    if (!label) return;
    button.setAttribute("aria-label", label);
    button.title = label;
  });
}

function labelCrepeControls() {
  labelIconButtons(".milkdown-top-bar .top-bar-item", topBarLabels);
  labelIconButtons(".milkdown-toolbar .toolbar-item", selectionToolbarLabels);
}

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

function insertEmoji(emotion: UbbEmotionDescriptor) {
  emojiPanelOpen.value = false;
  if (props.disabled || !editor.value) return;
  const src = resolveEmotionDisplaySrc(emotion, theme.effectiveMode === "dark");
  editor.value.action((ctx) => {
    const view = ctx.get(editorViewCtx);
    const node = view.state.schema.nodes.image?.createAndFill({
      src,
      alt: ubbEmotionDisplayName(emotion),
    });
    if (!node) return;
    view.focus();
    view.dispatch(view.state.tr.replaceSelectionWith(node));
  });
}

// 表情按钮在 topBar 内（面板之外），它的点击由 buildTopBar 的 onRun 负责开合，这里忽略。
onClickOutside(emojiPanel, () => (emojiPanelOpen.value = false), {
  ignore: [".milkdown-top-bar"],
});

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

onMounted(async () => {
  if (!editorRoot.value) return;

  const instance = new CrepeBuilder({
    root: editorRoot.value,
    defaultValue: props.modelValue,
  })
    .addFeature(codeMirror, {
      copyText: "复制",
      searchPlaceholder: "搜索语言",
      noResultText: "没有匹配的语言",
      previewLabel: "预览",
      previewLoading: "预览加载中…",
      previewToggleText: (previewOnlyMode) => (previewOnlyMode ? "编辑" : "隐藏预览"),
    })
    .addFeature(latex, { inlineEditConfirm: "确认" })
    .addFeature(cursor)
    .addFeature(listItem)
    .addFeature(linkTooltip, {
      editButton: "编辑链接",
      removeButton: "移除链接",
      confirmButton: "确认",
      inputPlaceholder: "粘贴链接地址",
    })
    .addFeature(blockEdit, {
      textGroup: {
        label: "文本",
        text: { label: "正文" },
        h1: { label: "一级标题" },
        h2: { label: "二级标题" },
        h3: { label: "三级标题" },
        h4: null,
        h5: null,
        h6: null,
        quote: { label: "引用" },
        divider: { label: "分隔线" },
      },
      listGroup: {
        label: "列表",
        bulletList: { label: "无序列表" },
        orderedList: { label: "有序列表" },
        taskList: { label: "任务列表" },
      },
      advancedGroup: {
        label: "插入",
        image: null,
        codeBlock: { label: "代码块" },
        table: { label: "表格" },
        math: { label: "公式" },
      },
    })
    .addFeature(toolbar)
    .addFeature(placeholder, { text: props.placeholder, mode: "doc" })
    .addFeature(table)
    .addFeature(topBar, {
      headingOptions: [
        { label: "正文", level: null },
        { label: "标题 1", level: 1 },
        { label: "标题 2", level: 2 },
        { label: "标题 3", level: 3 },
      ],
      buildTopBar: (builder) => {
        builder.addGroup("emoji", "表情").addItem("emoji", {
          icon: emojiButtonIcon,
          active: () => false,
          onRun: () => {
            if (props.disabled) return;
            emojiPanelOpen.value = !emojiPanelOpen.value;
          },
        });
      },
    });

  instance.setReadonly(props.disabled);
  // Crepe 的 CommonMark 组合未默认注册图片输入规则，需要显式启用。
  instance.editor.use(insertImageInputRule);
  // Crepe 默认先注册剪贴板插件，HTML 图片会在上传插件处理前被解析为外链。
  await instance.editor.remove(clipboard);
  instance.editor.use(clipboard);
  instance.on((listeners) => {
    listeners.markdownUpdated((_ctx, markdown, previous) => {
      if (markdown === previous) return;
      currentMarkdown.value = markdown;
      if (markdown !== props.modelValue) emit("update:modelValue", markdown);
    });
  });
  instance.editor.config((ctx) => {
    ctx.update(editorViewOptionsCtx, (previous) => ({
      ...previous,
      attributes: {
        ...previous.attributes,
        "aria-label": props.placeholder,
        class: "cc98-crepe-editor",
      },
    }));
    ctx.update(uploadConfig.key, (previous) => ({
      ...previous,
      enableHtmlFileUploader: true,
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
  });

  try {
    crepe.value = instance;
    editor.value = await instance.create();
    labelCrepeControls();
    editorReady.value = true;
  } catch (error) {
    logger.error({ err: error }, "Crepe 编辑器初始化失败");
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
    if (disabled) emojiPanelOpen.value = false;
    crepe.value?.setReadonly(disabled);
  },
);

onBeforeUnmount(() => {
  editorReady.value = false;
  void crepe.value?.destroy();
  crepe.value = null;
  editor.value = null;
});
</script>

<template>
  <div class="markdown-editor space-y-2" :class="{ 'markdown-editor--disabled': disabled }">
    <div class="markdown-editor__shell">
      <div ref="editorRoot" />
      <p v-if="!editorReady && !uploadError" class="markdown-editor__loading">编辑器加载中…</p>
    </div>

    <EmojiPanel v-if="emojiPanelOpen" ref="emojiPanel" @select="insertEmoji" />

    <div class="markdown-editor__actions">
      <div class="flex flex-wrap items-center gap-1">
        <UiButton
          variant="text"
          size="sm"
          :disabled="disabled || imageUploading"
          @click="imageInput?.click()"
        >
          {{ imageUploading ? "图片上传中…" : "上传图片" }}
        </UiButton>
        <UiButton
          variant="text"
          size="sm"
          :disabled="disabled || attachmentUploading"
          @click="attachmentInput?.click()"
        >
          {{ attachmentUploading ? "附件上传中…" : "上传附件" }}
        </UiButton>
        <span class="text-cc98-text-muted">支持粘贴或拖入图片，输入 / 可插入内容块。</span>
      </div>
      <p :class="overLimit ? 'text-cc98-accent' : 'text-cc98-text-muted'">
        {{ currentMarkdown.length }} / {{ maxLength }} 字
      </p>
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
    <p v-if="uploadError" class="text-sm text-cc98-accent">{{ uploadError }}</p>
  </div>
</template>

<style scoped>
.markdown-editor {
  position: relative;
}

.markdown-editor__shell {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--cc98-color-border);
  border-radius: var(--cc98-radius-sm);
  background: var(--cc98-color-surface);
  transition: border-color 150ms ease;
}

.markdown-editor__shell:focus-within {
  border-color: var(--cc98-color-primary);
}

.markdown-editor__loading {
  position: absolute;
  top: 4rem;
  left: 1rem;
  margin: 0;
  color: var(--cc98-color-text-caption);
  pointer-events: none;
}

.markdown-editor__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem 1rem;
  font-size: 0.75rem;
}

.markdown-editor--disabled .markdown-editor__shell {
  background: var(--cc98-color-surface-subtle);
}

.markdown-editor :deep(.milkdown) {
  --crepe-color-background: var(--cc98-color-surface);
  --crepe-color-on-background: var(--cc98-color-text);
  --crepe-color-surface: var(--cc98-color-surface);
  --crepe-color-surface-low: var(--cc98-color-surface-subtle);
  --crepe-color-on-surface: var(--cc98-color-text);
  --crepe-color-on-surface-variant: var(--cc98-color-text-muted);
  --crepe-color-outline: var(--cc98-color-text-muted);
  --crepe-color-primary: var(--cc98-color-primary);
  --crepe-color-secondary: var(--cc98-color-surface-subtle);
  --crepe-color-on-secondary: var(--cc98-color-text);
  --crepe-color-inverse: var(--cc98-color-text);
  --crepe-color-on-inverse: var(--cc98-color-surface);
  --crepe-color-inline-code: var(--cc98-color-accent);
  --crepe-color-error: var(--cc98-color-accent);
  --crepe-color-hover: color-mix(in srgb, var(--cc98-color-primary) 8%, var(--cc98-color-surface));
  --crepe-color-selected: color-mix(
    in srgb,
    var(--cc98-color-primary) 14%,
    var(--cc98-color-surface)
  );
  --crepe-color-inline-area: var(--cc98-color-surface-subtle);
  --crepe-font-title: system-ui, "PingFang SC", "Microsoft YaHei", sans-serif;
  --crepe-font-default: system-ui, "PingFang SC", "Microsoft YaHei", sans-serif;
  --crepe-font-code: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  --crepe-shadow-1: 0 4px 14px color-mix(in srgb, var(--cc98-color-text) 12%, transparent);
  --crepe-shadow-2: 0 8px 24px color-mix(in srgb, var(--cc98-color-text) 16%, transparent);
  min-height: 20rem;
}

.markdown-editor :deep(.milkdown-top-bar) {
  position: sticky;
  z-index: 2;
  top: 0;
  border-bottom: 1px solid var(--cc98-color-border);
  background: var(--cc98-color-surface-subtle);
}

.markdown-editor :deep(.milkdown-top-bar .top-bar-inner) {
  min-height: 2.75rem;
  padding-inline: 0.5rem;
}

.markdown-editor :deep(.milkdown .ProseMirror) {
  box-sizing: border-box;
  min-height: 20rem;
  padding: 1.25rem clamp(1rem, 4vw, 3rem) 2.5rem;
  color: var(--cc98-color-text);
  font-size: 0.9375rem;
  line-height: 1.75;
  overflow-wrap: anywhere;
}

.markdown-editor :deep(.milkdown .ProseMirror h1),
.markdown-editor :deep(.milkdown .ProseMirror h2),
.markdown-editor :deep(.milkdown .ProseMirror h3) {
  font-weight: 650;
  letter-spacing: -0.01em;
}

.markdown-editor :deep(.milkdown .ProseMirror blockquote) {
  border-left-color: var(--cc98-color-primary);
  color: var(--cc98-color-text-muted);
}

.markdown-editor :deep(.milkdown .ProseMirror img) {
  max-width: 100%;
}

.markdown-editor--disabled :deep(.milkdown) {
  --crepe-color-background: var(--cc98-color-surface-subtle);
}

@media (max-width: 640px) {
  .markdown-editor :deep(.milkdown-top-bar) {
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-inline: 0.25rem;
  }

  .markdown-editor :deep(.milkdown-top-bar .top-bar-inner) {
    flex-wrap: nowrap;
    overflow-x: auto;
  }

  .markdown-editor :deep(.milkdown .ProseMirror) {
    padding: 1rem;
    font-size: 0.875rem;
  }
}
</style>
