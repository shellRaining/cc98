<script setup lang="ts">
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
} from "reka-ui";

withDefaults(
  defineProps<{
    title: string;
    description: string;
    triggerLabel: string;
    confirmLabel?: string;
    pending?: boolean;
    disabled?: boolean;
  }>(),
  {
    confirmLabel: "确认",
    pending: false,
    disabled: false,
  },
);

const emit = defineEmits<{
  confirm: [];
}>();
</script>

<template>
  <AlertDialogRoot>
    <AlertDialogTrigger as-child>
      <button type="button" class="cc98-link text-sm disabled:opacity-50" :disabled="disabled">
        {{ triggerLabel }}
      </button>
    </AlertDialogTrigger>
    <AlertDialogPortal>
      <AlertDialogOverlay class="cc98-overlay" />
      <AlertDialogContent class="cc98-modal w-[min(28rem,calc(100vw-2rem))]">
        <AlertDialogTitle class="text-lg font-semibold text-cc98-text">{{
          title
        }}</AlertDialogTitle>
        <AlertDialogDescription class="mt-2 text-sm text-cc98-text-muted">
          {{ description }}
        </AlertDialogDescription>
        <div class="mt-5 flex justify-end gap-3">
          <AlertDialogCancel as-child>
            <button
              type="button"
              class="rounded border border-cc98-border px-3 py-1.5 text-sm"
              :disabled="pending"
            >
              取消
            </button>
          </AlertDialogCancel>
          <AlertDialogAction as-child>
            <button
              type="button"
              class="cc98-btn bg-cc98-error px-3 py-1.5 text-sm"
              :disabled="pending"
              @click="emit('confirm')"
            >
              {{ pending ? "处理中…" : confirmLabel }}
            </button>
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>
