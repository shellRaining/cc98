<script setup lang="ts">
import { computed } from "vue";
import {
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from "reka-ui";

export interface UiSelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

type SelectVariant = "default" | "header";

const props = withDefaults(
  defineProps<{
    modelValue?: string | number;
    options: readonly UiSelectOption[];
    placeholder?: string;
    disabled?: boolean;
    id?: string;
    ariaLabel?: string;
    variant?: SelectVariant;
  }>(),
  {
    modelValue: undefined,
    placeholder: "请选择",
    disabled: false,
    id: undefined,
    ariaLabel: undefined,
    variant: "default",
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string | number];
}>();

const triggerClasses = computed(() => [
  "ui-select__trigger",
  `ui-select__trigger--${props.variant}`,
]);
const contentClasses = computed(() => [
  "ui-select__content",
  `ui-select__content--${props.variant}`,
]);
const contentSideOffset = computed(() => (props.variant === "header" ? 0 : 4));
const selectedLabel = computed(
  () => props.options.find((option) => option.value === props.modelValue)?.label,
);

function updateValue(value: string | number) {
  emit("update:modelValue", value);
}
</script>

<template>
  <SelectRoot :model-value="modelValue" :disabled="disabled" @update:model-value="updateValue">
    <SelectTrigger :id="id" :class="triggerClasses" :aria-label="ariaLabel">
      <SelectValue class="ui-select__value" :placeholder="placeholder">
        {{ selectedLabel ?? placeholder }}
      </SelectValue>
      <SelectIcon class="ui-select__icon">
        <span class="i-fa-caret-down ui-select__chevron" aria-hidden="true" />
      </SelectIcon>
    </SelectTrigger>
    <SelectPortal>
      <SelectContent :class="contentClasses" position="popper" :side-offset="contentSideOffset">
        <SelectViewport class="ui-select__viewport">
          <SelectItem
            v-for="option in options"
            :key="option.value"
            class="ui-select__item"
            :value="option.value"
            :disabled="option.disabled"
          >
            <SelectItemText>{{ option.label }}</SelectItemText>
          </SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>

<style>
.ui-select__trigger {
  display: inline-flex;
  min-width: 8rem;
  height: 2rem;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding-inline: 0.625rem;
  border: 1px solid var(--cc98-color-border);
  border-radius: 4px;
  background: var(--cc98-color-surface);
  color: var(--cc98-color-text);
  font: inherit;
  cursor: pointer;
  outline: none;
}

.ui-select__trigger:focus-visible {
  border-color: var(--cc98-color-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--cc98-color-primary) 20%, transparent);
}

.ui-select__trigger:disabled {
  cursor: default;
  opacity: 0.55;
}

.ui-select__trigger--header {
  min-width: 0;
  width: 3rem;
  height: 100%;
  gap: 0;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--cc98-color-header-search-text);
  font-size: 0.75rem;
}

.ui-select__trigger--header:focus-visible {
  border-color: transparent;
  color: var(--cc98-color-header-search-text);
  box-shadow: none;
}

.ui-select__value {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ui-select__trigger--header .ui-select__value {
  display: flex;
  width: 2rem;
  height: 1.125rem;
  flex: 0 0 2rem;
  align-items: center;
  justify-content: center;
  line-height: 1.125rem;
}

.ui-select__icon {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
}

.ui-select__trigger--header .ui-select__icon {
  width: 1rem;
  height: 100%;
}

.ui-select__chevron {
  width: 0.4375rem;
  min-width: 0.4375rem;
  max-width: 0.4375rem;
  height: 0.75rem;
  flex: none;
  transition: transform 0.15s ease;
}

.ui-select__trigger[data-state="open"] .ui-select__chevron {
  transform: rotate(180deg);
}

.ui-select__content {
  z-index: 200;
  min-width: var(--reka-select-trigger-width);
  overflow: hidden;
  border: 1px solid var(--cc98-color-border);
  border-radius: 4px;
  background: var(--cc98-color-surface);
  color: var(--cc98-color-text);
  box-shadow: 0 4px 12px rgb(0 0 0 / 0.16);
}

.ui-select__content--header {
  min-width: 2rem;
  width: 2rem;
  border: 0;
  border-radius: 0;
  background: var(--cc98-color-primary-fill);
  color: var(--cc98-color-on-primary);
  font-size: 0.75rem;
  box-shadow: none;
}

.ui-select__content--header[data-state="open"] {
  animation: ui-select-header-open 0.15s ease-out;
}

.ui-select__content--header[data-state="closed"] {
  animation: ui-select-header-close 0.1s ease-in;
}

@keyframes ui-select-header-open {
  from {
    clip-path: inset(0 0 100%);
    opacity: 0;
  }

  to {
    clip-path: inset(0);
    opacity: 1;
  }
}

@keyframes ui-select-header-close {
  from {
    clip-path: inset(0);
    opacity: 1;
  }

  to {
    clip-path: inset(0 0 100%);
    opacity: 0;
  }
}

.ui-select__viewport {
  padding-block: 0.25rem;
}

.ui-select__item {
  display: flex;
  height: 2rem;
  align-items: center;
  justify-content: center;
  padding-inline: 0.75rem;
  cursor: pointer;
  outline: none;
  white-space: nowrap;
}

.ui-select__item[data-state="checked"] {
  font-weight: 600;
}

.ui-select__item[data-highlighted] {
  background: var(--cc98-color-primary-fill);
  color: var(--cc98-color-on-primary);
}

.ui-select__item[data-disabled] {
  cursor: default;
  opacity: 0.45;
}

.ui-select__content--header .ui-select__viewport {
  padding: 0;
}

.ui-select__content--header .ui-select__item {
  width: 2rem;
  height: 1.5rem;
  padding: 0;
  color: var(--cc98-color-on-primary);
  font-weight: 400;
}

.ui-select__content--header .ui-select__item[data-state="checked"] {
  font-weight: 400;
}

.ui-select__content--header .ui-select__item[data-highlighted] {
  background: var(--cc98-color-primary-fill);
}

.ui-select__content--header .ui-select__item:hover,
.ui-select__content--header .ui-select__item[data-highlighted]:not([data-state="checked"]) {
  background: var(--cc98-color-secondary);
}

@media (prefers-reduced-motion: reduce) {
  .ui-select__trigger--header .ui-select__chevron {
    transition: none;
  }

  .ui-select__content--header[data-state] {
    animation: none;
  }
}
</style>
