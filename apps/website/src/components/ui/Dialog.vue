<script setup lang="ts">
import { computed } from "vue";
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle,
  AlertDialogTrigger,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "reka-ui";
import UiButton from "./Button.vue";

/**
 * 统一的模态弹层组件，吸收 Reka UI Dialog 与 AlertDialog 两族原语差异。
 *
 * - alert 模式（AlertDialog）：遮罩和 Esc 不关闭，只能点按钮关闭，适合危险确认。
 * - 默认模式（Dialog）：点遮罩或 Esc 可关闭，适合普通表单弹层。
 *
 * 提供 trigger、内容默认插槽、footer 插槽，以及 title/description/pending 的快捷 prop。
 * pending 会同时禁用取消和确认按钮，确认按钮自动展示「处理中…」文案。
 */

const props = withDefaults(
  defineProps<{
    open?: boolean;
    alert?: boolean;
    title: string;
    description?: string;
    /** 确认按钮文字，留空则不渲染默认确认按钮（用 footer 插槽自行控制） */
    confirmLabel?: string;
    /** 确认按钮变体，alert 模式默认 danger，普通模式默认 primary */
    confirmVariant?: "primary" | "danger";
    cancelLabel?: string;
    pending?: boolean;
    /** 弹层宽度，传完整的 UnoCSS class，如 w-[min(28rem,calc(100vw-2rem))] */
    widthClass?: string;
  }>(),
  {
    open: undefined,
    alert: false,
    description: "",
    confirmLabel: "",
    confirmVariant: undefined,
    cancelLabel: "取消",
    pending: false,
    widthClass: "w-[min(28rem,calc(100vw-2rem))]",
  },
);

const emit = defineEmits<{
  "update:open": [value: boolean];
  confirm: [];
  cancel: [];
}>();

const resolvedConfirmVariant = computed(
  () => props.confirmVariant ?? (props.alert ? "danger" : "primary"),
);
</script>

<template>
  <AlertDialogRoot v-if="alert" :open="open" @update:open="emit('update:open', $event)">
    <AlertDialogTrigger v-if="$slots.trigger" as-child>
      <slot name="trigger" />
    </AlertDialogTrigger>
    <AlertDialogPortal>
      <AlertDialogOverlay class="cc98-overlay" />
      <AlertDialogContent :class="['cc98-modal', widthClass]">
        <AlertDialogTitle class="text-lg font-semibold text-cc98-text">{{
          title
        }}</AlertDialogTitle>
        <AlertDialogDescription v-if="description" class="mt-2 text-sm text-cc98-text-muted">
          {{ description }}
        </AlertDialogDescription>
        <slot />
        <div v-if="$slots.footer || confirmLabel" class="mt-5 flex justify-end gap-3">
          <slot name="footer">
            <AlertDialogCancel as-child>
              <UiButton variant="ghost" size="sm" :disabled="pending" @click="emit('cancel')">
                {{ cancelLabel }}
              </UiButton>
            </AlertDialogCancel>
            <AlertDialogAction as-child>
              <UiButton
                :variant="resolvedConfirmVariant"
                size="sm"
                :loading="pending"
                @click="emit('confirm')"
              >
                {{ pending ? "处理中…" : confirmLabel }}
              </UiButton>
            </AlertDialogAction>
          </slot>
        </div>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>

  <DialogRoot v-else :open="open" @update:open="emit('update:open', $event)">
    <DialogTrigger v-if="$slots.trigger" as-child>
      <slot name="trigger" />
    </DialogTrigger>
    <DialogPortal>
      <DialogOverlay class="cc98-overlay" />
      <DialogContent :class="['cc98-modal', widthClass]">
        <DialogTitle class="text-lg font-semibold text-cc98-text">{{ title }}</DialogTitle>
        <DialogDescription v-if="description" class="mt-1 text-sm text-cc98-text-muted">
          {{ description }}
        </DialogDescription>
        <slot />
        <div v-if="$slots.footer || confirmLabel" class="mt-5 flex justify-end gap-3">
          <slot name="footer">
            <DialogClose as-child>
              <UiButton variant="ghost" size="sm" :disabled="pending" @click="emit('cancel')">
                {{ cancelLabel }}
              </UiButton>
            </DialogClose>
            <UiButton
              :variant="resolvedConfirmVariant"
              size="sm"
              :loading="pending"
              @click="emit('confirm')"
            >
              {{ pending ? "处理中…" : confirmLabel }}
            </UiButton>
          </slot>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
