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
      <AlertDialogOverlay class="fixed inset-0 z-40 bg-black/50" />
      <AlertDialogContent
        class="fixed left-1/2 top-1/2 z-50 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded border border-cc98-border bg-cc98-bg-elevated p-5 shadow-xl"
      >
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
              class="rounded bg-red-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
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
