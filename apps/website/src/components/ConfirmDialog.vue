<script setup lang="ts">
import UiDialog from "./ui/Dialog.vue";

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
  <UiDialog
    alert
    :title="title"
    :description="description"
    :confirm-label="confirmLabel"
    :pending="pending"
    @confirm="emit('confirm')"
  >
    <template #trigger>
      <UiButton variant="ghost" size="sm" :disabled="disabled">{{ triggerLabel }}</UiButton>
    </template>
  </UiDialog>
</template>
